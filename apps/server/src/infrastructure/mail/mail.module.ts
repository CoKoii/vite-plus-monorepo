import { MailerModule } from "@nestjs-modules/mailer";
import { Module, Global } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { MailService } from "./mail.service";

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        if (!configService.get<boolean>("MAIL_ENABLED", false)) {
          return {
            transport: { streamTransport: true, buffer: true },
            defaults: { from: "no-reply@localhost" },
          };
        }

        return {
          transport: {
            host: configService.getOrThrow<string>("SMTP_HOST"),
            port: configService.getOrThrow<number>("SMTP_PORT"),
            secure: configService.getOrThrow<boolean>("SMTP_SECURE"),
            auth: {
              user: configService.getOrThrow<string>("SMTP_USER"),
              pass: configService.getOrThrow<string>("SMTP_PASSWORD"),
            },
            connectionTimeout: 5000,
            greetingTimeout: 5000,
            socketTimeout: 5000,
          },
          defaults: {
            from: configService.getOrThrow<string>("SMTP_FROM"),
          },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
