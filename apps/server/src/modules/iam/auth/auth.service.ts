import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";

import {
  EmailInvalidException,
  MailSendFailedException,
  TooManyRequestsException,
} from "../../../common/errors/business.exception";
import { MailService } from "../../../infrastructure/mail/mail.service";
import { GenerateCaptchaDto } from "./dto/generate-captcha.dto";
import { RegisterAuthDto } from "./dto/register-auth.dto";

@Injectable()
export class AuthService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
    private readonly mailService: MailService,
  ) {}

  /* 生成验证码 */
  async generateCaptcha(generateCaptchaDto: GenerateCaptchaDto) {
    const { email } = generateCaptchaDto;
    const captchaKey = `captcha:register:${email}`;
    const cooldownKey = `captcha:register:cooldown:${email}`;
    const cooldown = await this.cache.get(cooldownKey);
    if (cooldown) {
      throw new TooManyRequestsException();
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // 保存验证码，5分钟后自动过期
    await this.cache.set(captchaKey, code, 5 * 60 * 1000);
    // 设置60秒发送冷却
    await this.cache.set(cooldownKey, true, 60 * 1000);
    // 发送邮件
    try {
      await this.mailService.sendVerificationCode(email, code, "http://localhost:5173/login");
    } catch {
      // 邮件发送失败，清理已设置的缓存
      await this.cache.del(captchaKey);
      await this.cache.del(cooldownKey);
      throw new MailSendFailedException();
    }

    return { message: "验证码已发送" };
  }

  /* 用户注册 */
  register(registerAuthDto: RegisterAuthDto) {
    console.log(registerAuthDto);
    throw new EmailInvalidException();
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
