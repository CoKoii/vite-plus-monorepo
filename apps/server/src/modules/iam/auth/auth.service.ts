/** 认证服务：验证码、注册、登录、刷新、退出 */
import { randomInt } from "node:crypto";

import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectDataSource } from "@nestjs/typeorm";
import * as argon2 from "argon2";
import { DataSource, QueryFailedError } from "typeorm";

import {
  AccountDisabledException,
  CaptchaInvalidException,
  EmailRequiredException,
  EmailAlreadyExistsException,
  FeatureDisabledException,
  InvalidCredentialsException,
  MailSendFailedException,
  PasswordCodeInvalidException,
  PasswordUnchangedException,
  TokenInvalidException,
  TooManyRequestsException,
} from "../../../common/errors/business.exception";
import { normalizeEmail } from "../../../common/utils/email.util";
import { REDIS_CLIENT, type RedisClient } from "../../../infrastructure/cache/cache.module";
import { MailService } from "../../../infrastructure/mail/mail.service";
import { Profile } from "../profiles/entities/profile.entity";
import { User } from "../users/entities/user.entity";
import { UsersService } from "../users/users.service";
import { ChangePasswordAuthDto } from "./dto/change-password-auth.dto";
import { ForgotPasswordAuthDto } from "./dto/forgot-password-auth.dto";
import { GenerateCaptchaDto } from "./dto/generate-captcha.dto";
import { RegisterAuthDto } from "./dto/register-auth.dto";
import { ResetPasswordAuthDto } from "./dto/reset-password-auth.dto";
import { TokenService, type TokenPair } from "./token.service";

const CAPTCHA_TTL_MS = 5 * 60 * 1000;
const CAPTCHA_COOLDOWN_MS = 60 * 1000;
const CODE_MAX_ATTEMPTS = 5;

const CONSUME_CODE_SCRIPT = `
local value = redis.call("GET", KEYS[1])
if value == ARGV[1] then
  redis.call("DEL", KEYS[1], KEYS[2])
  return 1
end

local attempts = redis.call("INCR", KEYS[2])
if attempts == 1 then
  redis.call("PEXPIRE", KEYS[2], ARGV[2])
end
if attempts >= tonumber(ARGV[3]) then
  redis.call("DEL", KEYS[1], KEYS[2])
end
return 0
`;

@Injectable()
export class AuthService {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: RedisClient,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /** 发送验证码到 email，60 秒冷却，5 分钟过期 */
  async generateCaptcha(dto: GenerateCaptchaDto) {
    if (!this.configService.get<boolean>("CAPTCHA_ENABLED", false)) {
      throw new FeatureDisabledException("验证码注册未开启");
    }

    const email = normalizeEmail(dto.email);
    const codeKey = `captcha:code:${email}`;
    const cooldownKey = `captcha:cooldown:${email}`;
    const attemptsKey = `captcha:attempts:${email}`;
    const code = randomInt(100000, 1000000).toString();
    const acquired = await this.redisClient.set(cooldownKey, "1", {
      NX: true,
      PX: CAPTCHA_COOLDOWN_MS,
    });
    if (acquired !== "OK") throw new TooManyRequestsException();

    try {
      await this.redisClient.del(attemptsKey);
      await this.redisClient.set(codeKey, code, { PX: CAPTCHA_TTL_MS });
      await this.mailService.sendVerificationCode(
        email,
        code,
        this.configService.getOrThrow("LOGIN_URL"),
      );
    } catch {
      await Promise.all([
        this.redisClient.del(codeKey),
        this.redisClient.del(cooldownKey),
        this.redisClient.del(attemptsKey),
      ]);
      throw new MailSendFailedException();
    }
    return "注册验证码已发送，请查收";
  }

  /** 注册账号并创建空资料，事务保证一致性 */
  async register(dto: RegisterAuthDto): Promise<TokenPair> {
    const email = normalizeEmail(dto.email);
    const { captcha, password } = dto;

    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new EmailAlreadyExistsException();

    const captchaEnabled = this.configService.get<boolean>("CAPTCHA_ENABLED", false);
    if (captchaEnabled) {
      if (!captcha) throw new CaptchaInvalidException();
      await this.consumeCode(`captcha:code:${email}`, captcha, CaptchaInvalidException);
    } else if (captcha !== undefined) {
      throw new FeatureDisabledException("验证码注册未开启");
    }

    const hashed = await argon2.hash(password);

    let user: User;
    try {
      user = await this.dataSource.transaction(async (tx) => {
        const users = tx.getRepository(User);
        const profiles = tx.getRepository(Profile);

        const u = await users.save(
          users.create({
            email,
            passwordHash: hashed,
            emailVerifiedAt: captchaEnabled ? new Date() : null,
          }),
        );
        await profiles.save(profiles.create({ nickname: email, user: u }));
        return u;
      });
    } catch (error) {
      if (error instanceof QueryFailedError && error.driverError?.code === "23505") {
        throw new EmailAlreadyExistsException();
      }
      throw error;
    }

    return this.tokenService.generateTokenPair(user);
  }

  /** email + password 登录 */
  async login(email: string, password: string): Promise<TokenPair> {
    const user = await this.usersService.findByEmail(email, true);
    if (!user || !user.passwordHash) {
      await argon2.hash(password);
      throw new InvalidCredentialsException();
    }
    if (!(await argon2.verify(user.passwordHash, password)))
      throw new InvalidCredentialsException();
    if (user.status !== 1) throw new AccountDisabledException();
    return this.tokenService.generateTokenPair(user);
  }

  /** 为已登录用户发送修改密码验证码。 */
  async requestChangePasswordCode(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user?.email) throw new EmailRequiredException();

    await this.sendPasswordCode(`password:change:${userId}`, user.email);
    return "修改密码验证码已发送，请查收";
  }

  /** 修改密码，并撤销所有旧设备会话。 */
  async changePassword(userId: number, dto: ChangePasswordAuthDto) {
    return this.tokenService.withUserLock(userId, async () => {
      const user = await this.usersService.findById(userId, true);
      if (!user?.passwordHash) throw new InvalidCredentialsException("该账户未设置密码");
      if (!(await argon2.verify(user.passwordHash, dto.currentPassword))) {
        throw new InvalidCredentialsException("当前密码错误");
      }
      if (await argon2.verify(user.passwordHash, dto.newPassword)) {
        throw new PasswordUnchangedException();
      }

      await this.consumePasswordCode(`password:change:${userId}`, dto.code);
      const updatedUser = await this.usersService.updatePassword(
        userId,
        await argon2.hash(dto.newPassword),
      );
      await this.tokenService.revokeAllSessions(userId);
      return this.tokenService.generateTokenPair(updatedUser);
    });
  }

  /** 请求忘记密码验证码，直接反馈邮箱和邮件发送结果。 */
  async requestPasswordReset(dto: ForgotPasswordAuthDto) {
    const email = normalizeEmail(dto.email);
    const user = await this.usersService.findByEmail(email);
    if (user?.status === 1) await this.sendPasswordCode(`password:reset:${email}`, email);
    return "密码重置验证码已发送至您的邮箱，请查收";
  }

  /** 使用邮箱验证码重置密码，并撤销所有旧设备会话。 */
  async resetPassword(dto: ResetPasswordAuthDto) {
    const email = normalizeEmail(dto.email);
    const user = await this.usersService.findByEmail(email, true);
    if (!user || user.status !== 1 || !user.passwordHash) {
      throw new PasswordCodeInvalidException();
    }
    return this.tokenService.withUserLock(user.id, async () => {
      const currentUser = await this.usersService.findById(user.id, true);
      if (!currentUser || currentUser.status !== 1 || !currentUser.passwordHash) {
        throw new PasswordCodeInvalidException();
      }
      if (await argon2.verify(currentUser.passwordHash, dto.newPassword)) {
        throw new PasswordUnchangedException();
      }

      await this.consumePasswordCode(`password:reset:${email}`, dto.code);
      await this.usersService.updatePassword(user.id, await argon2.hash(dto.newPassword));
      await this.tokenService.revokeAllSessions(user.id);
      return "密码重置成功，请重新登录";
    });
  }

  /** 刷新 token，旧 token 自动失效 */
  async refresh(oldRefreshToken: string): Promise<TokenPair> {
    const session = await this.tokenService.resolveRefreshToken(oldRefreshToken);
    return this.tokenService.withUserLock(session.userId, async () => {
      const currentSession = await this.tokenService.resolveRefreshToken(oldRefreshToken);
      const user = await this.usersService.findById(currentSession.userId);
      if (!user) throw new InvalidCredentialsException("账户不存在");
      if (user.status !== 1) throw new AccountDisabledException();
      if (currentSession.tokenVersion !== user.tokenVersion) throw new TokenInvalidException();
      return this.tokenService.rotateRefreshToken(
        oldRefreshToken,
        user,
        currentSession.sessionId,
      );
    });
  }

  /** 退出登录 */
  async logout(refreshToken: string): Promise<string> {
    await this.tokenService.revokeRefreshToken(refreshToken);
    return "已退出当前会话";
  }

  /** 退出当前用户的全部设备。 */
  async logoutAll(userId: number): Promise<string> {
    return this.tokenService.withUserLock(userId, async () => {
      await this.usersService.incrementTokenVersion(userId);
      await this.tokenService.revokeAllSessions(userId);
      return "已退出所有设备";
    });
  }

  private async sendPasswordCode(keyPrefix: string, email: string) {
    const codeKey = `auth:${keyPrefix}:code`;
    const cooldownKey = `auth:${keyPrefix}:cooldown`;
    const attemptsKey = `auth:${keyPrefix}:attempts`;

    const code = randomInt(100000, 1000000).toString();
    const acquired = await this.redisClient.set(cooldownKey, "1", {
      NX: true,
      PX: CAPTCHA_COOLDOWN_MS,
    });
    if (acquired !== "OK") throw new TooManyRequestsException();

    try {
      await this.redisClient.del(attemptsKey);
      await this.redisClient.set(codeKey, code, { PX: CAPTCHA_TTL_MS });
      await this.mailService.sendPasswordVerificationCode(email, code);
    } catch {
      await Promise.all([
        this.redisClient.del(codeKey),
        this.redisClient.del(cooldownKey),
        this.redisClient.del(attemptsKey),
      ]);
      throw new MailSendFailedException();
    }
  }

  private async consumePasswordCode(keyPrefix: string, code: string) {
    await this.consumeCode(`auth:${keyPrefix}:code`, code, PasswordCodeInvalidException);
  }

  private async consumeCode(
    codeKey: string,
    code: string,
    ExceptionType: new () => Error,
  ) {
    const attemptsKey = codeKey.replace(/:code$/, ":attempts");
    const consumed = await this.redisClient.eval(CONSUME_CODE_SCRIPT, {
      keys: [codeKey, attemptsKey],
      arguments: [code, String(CAPTCHA_TTL_MS), String(CODE_MAX_ATTEMPTS)],
    });
    if (consumed !== 1) throw new ExceptionType();
  }
}
