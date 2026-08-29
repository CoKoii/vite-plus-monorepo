import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  CaptchaInvalidException,
  EmailAlreadyExistsException,
  MailSendFailedException,
  TooManyRequestsException,
} from "../../../common/errors/business.exception";
import { MailService } from "../../../infrastructure/mail/mail.service";
import { User } from "../users/entities/user.entity";
import { GenerateCaptchaDto } from "./dto/generate-captcha.dto";
import { RegisterAuthDto } from "./dto/register-auth.dto";

@Injectable()
export class AuthService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
    private readonly mailService: MailService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

    return "验证码发送成功，请注意查收";
  }

  /* 用户注册 */
  async register(registerAuthDto: RegisterAuthDto) {
    // 校验验证码
    const { email, captcha } = registerAuthDto;
    const captchaKey = `captcha:register:${email}`;
    const cachedCaptcha = await this.cache.get(captchaKey);
    if (!cachedCaptcha || cachedCaptcha !== captcha) {
      throw new CaptchaInvalidException();
    }
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new EmailAlreadyExistsException();
    }
    const user = this.userRepository.create(registerAuthDto);
    await this.userRepository.save(user);
    return "注册成功";
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
