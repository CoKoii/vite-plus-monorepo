import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { MailServiceDisabledException } from "../../common/errors/business.exception";
import { renderPasswordReset, renderVerificationCode, renderWelcome } from "./templates";

type SentMessageInfo = Awaited<ReturnType<MailerService["sendMail"]>>;

@Injectable()
export class MailService {
  private readonly projectName: string;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.projectName = this.configService.getOrThrow<string>("PROJECT_NAME");
  }

  private assertEnabled() {
    if (!this.configService.get<boolean>("MAIL_ENABLED", false)) {
      throw new MailServiceDisabledException();
    }
  }

  sendVerificationCode(to: string, code: string, loginUrl: string): Promise<SentMessageInfo> {
    this.assertEnabled();
    return this.mailerService.sendMail({
      to,
      subject: `【${this.projectName}】注册验证码`,
      html: renderVerificationCode(
        { code, actionUrl: loginUrl, actionLabel: "前往登录" },
        this.projectName,
      ),
    });
  }

  sendPasswordVerificationCode(to: string, code: string): Promise<SentMessageInfo> {
    this.assertEnabled();
    return this.mailerService.sendMail({
      to,
      subject: `【${this.projectName}】密码验证码`,
      html: renderVerificationCode({ code }, this.projectName),
    });
  }

  sendWelcome(to: string, username: string, loginUrl: string): Promise<SentMessageInfo> {
    this.assertEnabled();
    return this.mailerService.sendMail({
      to,
      subject: `【${this.projectName}】欢迎加入`,
      html: renderWelcome({ username, loginUrl }, this.projectName),
    });
  }

  sendPasswordReset(to: string, resetUrl: string): Promise<SentMessageInfo> {
    this.assertEnabled();
    return this.mailerService.sendMail({
      to,
      subject: `【${this.projectName}】重置密码`,
      html: renderPasswordReset({ resetUrl }, this.projectName),
    });
  }
}
