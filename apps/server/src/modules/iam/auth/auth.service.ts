import { randomInt } from "node:crypto";

import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectDataSource } from "@nestjs/typeorm";
import * as argon2 from "argon2";
import type { Cache } from "cache-manager";
import { DataSource } from "typeorm";

import {
  AccountDisabledException,
  CaptchaInvalidException,
  EmailAlreadyExistsException,
  InvalidCredentialsException,
  MailSendFailedException,
  TooManyRequestsException,
} from "../../../common/errors/business.exception";
import { MailService } from "../../../infrastructure/mail/mail.service";
import { Profile } from "../profiles/entities/profile.entity";
import { User } from "../users/entities/user.entity";
import { UsersService } from "../users/users.service";
import { GenerateCaptchaDto } from "./dto/generate-captcha.dto";
import { RegisterAuthDto } from "./dto/register-auth.dto";
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

  /** 发送验证码到邮箱，60 秒冷却，5 分钟过期 */
  async generateCaptcha(dto: GenerateCaptchaDto) {
    const { email } = dto;
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
    return "验证码发送成功，请注意查收";
  }

  /** 注册账号并创建空资料，事务保证一致性 */
  async register(dto: RegisterAuthDto): Promise<TokenPair> {
    const { email, captcha, password } = dto;

    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new EmailAlreadyExistsException();

    const cached = await this.cache.get<string>(`captcha:code:${email}`);
    if (!cached || cached !== captcha) throw new CaptchaInvalidException();
    await this.cache.del(`captcha:code:${email}`);

    const hashed = await argon2.hash(password);

    const user = await this.dataSource.transaction(async (tx) => {
      const users = tx.getRepository(User);
      const profiles = tx.getRepository(Profile);

      const u = await users.save(users.create({ email, password: hashed }));
      await profiles.save(profiles.create({ user: u }));
      return u;
    });

    return this.tokenService.generateTokenPair(user);
  }

  /** 邮箱密码登录 */
  async login(email: string, password: string): Promise<TokenPair> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) {
      await argon2.hash(password);
      throw new InvalidCredentialsException();
    }
    if (!(await argon2.verify(user.password, password))) throw new InvalidCredentialsException();
    if (user.status !== 1) throw new AccountDisabledException();
    return this.tokenService.generateTokenPair(user);
  }

  /** 刷新 token，旧 token 自动失效 */
  async refresh(oldRefreshToken: string): Promise<TokenPair> {
    const userId = await this.tokenService.resolveRefreshToken(oldRefreshToken);
    const user = await this.usersService.findById(userId);
    if (!user) throw new InvalidCredentialsException("账户不存在");
    if (user.status !== 1) throw new AccountDisabledException();
    return this.tokenService.rotateRefreshToken(oldRefreshToken, user);
  }

  /** 退出登录 */
  async logout(refreshToken: string): Promise<void> {
    await this.tokenService.revokeRefreshToken(refreshToken);
  }
}
