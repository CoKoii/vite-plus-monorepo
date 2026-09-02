/** 认证服务：验证码、注册、登录、刷新、退出 */
import { randomInt } from "node:crypto";

import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { BadRequestException, Inject, Injectable } from "@nestjs/common";
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

  /** 发送验证码到 username 对应的邮箱，60 秒冷却，5 分钟过期 */
  async generateCaptcha(dto: GenerateCaptchaDto) {
    if (!this.configService.get<boolean>("CAPTCHA_ENABLED", false)) {
      throw new BadRequestException("验证码注册未开启");
    }

    const { username } = dto;
    const cooldown = await this.cache.get(`captcha:cooldown:${username}`);
    if (cooldown) throw new TooManyRequestsException();

    const code = randomInt(100000, 1000000).toString();
    await this.cache.set(`captcha:code:${username}`, code, 5 * 60 * 1000);
    await this.cache.set(`captcha:cooldown:${username}`, true, 60 * 1000);

    try {
      await this.mailService.sendVerificationCode(
        username,
        code,
        this.configService.getOrThrow("LOGIN_URL"),
      );
    } catch {
      await this.cache.del(`captcha:code:${username}`);
      await this.cache.del(`captcha:cooldown:${username}`);
      throw new MailSendFailedException();
    }
    return "验证码发送成功，请注意查收";
  }

  /** 注册账号并创建空资料，事务保证一致性 */
  async register(dto: RegisterAuthDto): Promise<TokenPair> {
    const { username, captcha, password } = dto;

    const existing = await this.usersService.findByUsername(username);
    if (existing) throw new EmailAlreadyExistsException();

    if (captcha !== undefined) {
      if (!this.configService.get<boolean>("CAPTCHA_ENABLED", false)) {
        throw new BadRequestException("验证码注册未开启");
      }

      const cached = await this.cache.get<string>(`captcha:code:${username}`);
      if (!captcha || !cached || cached !== captcha) throw new CaptchaInvalidException();
      await this.cache.del(`captcha:code:${username}`);
    }

    const hashed = await argon2.hash(password);

    const user = await this.dataSource.transaction(async (tx) => {
      const users = tx.getRepository(User);
      const profiles = tx.getRepository(Profile);

      const u = await users.save(users.create({ username, password: hashed }));
      await profiles.save(profiles.create({ nickname: username, user: u }));
      return u;
    });

    return this.tokenService.generateTokenPair(user);
  }

  /** username（邮箱）密码登录 */
  async login(username: string, password: string): Promise<TokenPair> {
    const user = await this.usersService.findByUsername(username, true);
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
