import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";

import { renderPasswordReset, renderVerificationCode, renderWelcome } from "./templates/index.ts";

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

  sendWelcome(to: string, username: string, loginUrl: string): Promise<SentMessageInfo> {
    return this.mailerService.sendMail({
      to,
      subject: "【vite-plus-monorepo】欢迎加入",
      html: renderWelcome({ username, loginUrl }),
    });
  }

  sendPasswordReset(to: string, resetUrl: string): Promise<SentMessageInfo> {
    return this.mailerService.sendMail({
      to,
      subject: "【vite-plus-monorepo】重置密码",
      html: renderPasswordReset({ resetUrl }),
    });
  }
}
