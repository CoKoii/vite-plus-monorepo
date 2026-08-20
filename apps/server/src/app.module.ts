import { Module } from "@nestjs/common";

import { AppConfigModule } from "./config/config.module";
import { CacheModule } from "./infrastructure/cache/cache.module";
import { DatabaseModule } from "./infrastructure/database/database.module";
import { LoggerModule } from "./infrastructure/logger/logger.module";
import { MailModule } from "./infrastructure/mail/mail.module";
import { UsersModule } from './modules/iam/users/users.module';
import { FileModule } from './modules/file/file/file.module';
import { ProfilesModule } from './modules/iam/profiles/profiles.module';

@Module({
  imports: [
    // 全局配置：env 加载 + Joi 校验
    AppConfigModule,

    // 全局日志：winston 控制台 + 滚动文件
    LoggerModule,

    // 全局缓存：Redis
    CacheModule,

    // 邮件：SMTP（QQ 邮箱）
    MailModule,

    // 数据库：PostgreSQL
    DatabaseModule,

    UsersModule,

    FileModule,

    ProfilesModule,
  ],
  controllers: [],
})
export class AppModule {}
