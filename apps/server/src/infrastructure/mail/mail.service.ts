import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { MailServiceDisabledException } from "../../common/errors/business.exception";
import { renderPasswordReset, renderVerificationCode, renderWelcome } from "./templates";

type SentMessageInfo = Awaited<ReturnType<MailerService["sendMail"]>>;

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  private assertEnabled() {
    if (!this.configService.get<boolean>("MAIL_ENABLED", false)) {
      throw new MailServiceDisabledException();
    }
  }

  sendVerificationCode(to: string, code: string, loginUrl: string): Promise<SentMessageInfo> {
    this.assertEnabled();
    return this.mailerService.sendMail({
      to,
      subject: "【vite-plus-monorepo】验证码",
      html: renderVerificationCode({ code, loginUrl }),
    });
  }

  sendPasswordVerificationCode(
    to: string,
    code: string,
    loginUrl: string,
  ): Promise<SentMessageInfo> {
    this.assertEnabled();
    return this.mailerService.sendMail({
      to,
      subject: "【vite-plus-monorepo】密码操作验证码",
      html: renderVerificationCode({ code, loginUrl }),
    });
  }

  sendWelcome(to: string, username: string, loginUrl: string): Promise<SentMessageInfo> {
    this.assertEnabled();
    return this.mailerService.sendMail({
      to,
      subject: "【vite-plus-monorepo】欢迎加入",
      html: renderWelcome({ username, loginUrl }),
    });
  }

  sendPasswordReset(to: string, resetUrl: string): Promise<SentMessageInfo> {
    this.assertEnabled();
    return this.mailerService.sendMail({
      to,
      subject: "【vite-plus-monorepo】重置密码",
      html: renderPasswordReset({ resetUrl }),
    });
  }
}
