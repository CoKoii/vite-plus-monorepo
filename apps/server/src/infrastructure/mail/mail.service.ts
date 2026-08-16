import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";

import { renderVerificationCode } from "./templates.ts";

// 复用 MailerService 的返回类型，避免依赖未安装类型的 nodemailer 包
type SentMessageInfo = Awaited<ReturnType<MailerService["sendMail"]>>;

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  sendVerificationCode(to: string, code: string, loginUrl: string): Promise<SentMessageInfo> {
    return this.mailerService.sendMail({
      to,
      subject: "【vite-plus-monorepo】验证码",
      html: renderVerificationCode({ code, loginUrl }),
    });
  }
}
