/** 认证服务：验证码、注册、登录、刷新、退出 */
import { randomInt } from "node:crypto";

import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectDataSource } from "@nestjs/typeorm";
import * as argon2 from "argon2";
import type { Cache } from "cache-manager";
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
  ResourceNotFoundException,
  TooManyRequestsException,
  ValidationException,
} from "../../../common/errors/business.exception";
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

@Injectable()
export class AuthService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
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

    const email = dto.email.trim().toLowerCase();
    const cooldown = await this.cache.get(`captcha:cooldown:${email}`);
    if (cooldown) throw new TooManyRequestsException();

    const code = randomInt(100000, 1000000).toString();
    await this.cache.set(`captcha:code:${email}`, code, 5 * 60 * 1000);
    await this.cache.set(`captcha:cooldown:${email}`, true, 60 * 1000);

    try {
      await this.mailService.sendVerificationCode(
        email,
        code,
        this.configService.getOrThrow("LOGIN_URL"),
      );
    } catch {
      await this.cache.del(`captcha:code:${email}`);
      await this.cache.del(`captcha:cooldown:${email}`);
      throw new MailSendFailedException();
    }
    return "注册验证码已发送，请查收";
  }

  /** 注册账号并创建空资料，事务保证一致性 */
  async register(dto: RegisterAuthDto): Promise<TokenPair> {
    const email = dto.email.trim().toLowerCase();
    const { captcha, password } = dto;

    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new EmailAlreadyExistsException();

    const captchaEnabled = this.configService.get<boolean>("CAPTCHA_ENABLED", false);
    if (captchaEnabled) {
      if (!captcha) throw new CaptchaInvalidException();
      const cached = await this.cache.get<string>(`captcha:code:${email}`);
      if (!cached || cached !== captcha) throw new CaptchaInvalidException();
      await this.cache.del(`captcha:code:${email}`);
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
  }

  /** 请求忘记密码验证码，直接反馈邮箱和邮件发送结果。 */
  async requestPasswordReset(dto: ForgotPasswordAuthDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new ResourceNotFoundException("该邮箱未注册");
    if (user.status !== 1) throw new AccountDisabledException();

    await this.sendPasswordCode(`password:reset:${email}`, email);
    return "密码重置验证码已发送至您的邮箱，请查收";
  }

  /** 使用邮箱验证码重置密码，并撤销所有旧设备会话。 */
  async resetPassword(dto: ResetPasswordAuthDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(email, true);
    if (!user) throw new ResourceNotFoundException("该邮箱未注册");
    if (user.status !== 1) throw new AccountDisabledException();
    if (!user.passwordHash) throw new ValidationException("该账户未设置密码");
    if (await argon2.verify(user.passwordHash, dto.newPassword)) {
      throw new PasswordUnchangedException();
    }

    await this.consumePasswordCode(`password:reset:${email}`, dto.code);
    await this.usersService.updatePassword(user.id, await argon2.hash(dto.newPassword));
    await this.tokenService.revokeAllSessions(user.id);
    return "密码重置成功，请重新登录";
  }

  /** 刷新 token，旧 token 自动失效 */
  async refresh(oldRefreshToken: string): Promise<TokenPair> {
    const session = await this.tokenService.resolveRefreshToken(oldRefreshToken);
    const user = await this.usersService.findById(session.userId);
    if (!user) throw new InvalidCredentialsException("账户不存在");
    if (user.status !== 1) throw new AccountDisabledException();
    return this.tokenService.rotateRefreshToken(oldRefreshToken, user, session.sessionId);
  }

  /** 退出登录 */
  async logout(refreshToken: string): Promise<string> {
    await this.tokenService.revokeRefreshToken(refreshToken);
    return "已退出当前会话";
  }

  /** 退出当前用户的全部设备。 */
  async logoutAll(userId: number): Promise<string> {
    await this.usersService.incrementTokenVersion(userId);
    await this.tokenService.revokeAllSessions(userId);
    return "已退出所有设备";
  }

  private async sendPasswordCode(keyPrefix: string, email: string) {
    const codeKey = `auth:${keyPrefix}:code`;
    const cooldownKey = `auth:${keyPrefix}:cooldown`;
    if (await this.cache.get(cooldownKey)) throw new TooManyRequestsException();

    const code = randomInt(100000, 1000000).toString();
    await this.cache.set(codeKey, code, 5 * 60 * 1000);
    await this.cache.set(cooldownKey, true, 60 * 1000);
    try {
      await this.mailService.sendPasswordVerificationCode(email, code);
    } catch {
      await Promise.all([this.cache.del(codeKey), this.cache.del(cooldownKey)]);
      throw new MailSendFailedException();
    }
  }

  private async consumePasswordCode(keyPrefix: string, code: string) {
    const key = `auth:${keyPrefix}:code`;
    const cached = await this.cache.get<string>(key);
    if (!cached || cached !== code) throw new PasswordCodeInvalidException();
    await this.cache.del(key);
  }
}
