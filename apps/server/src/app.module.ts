import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";

import { AppConfigModule } from "./config/config.module";
import { CacheModule } from "./infrastructure/cache/cache.module";
import { DatabaseModule } from "./infrastructure/database/database.module";
import { LoggerModule } from "./infrastructure/logger/logger.module";
import { MailModule } from "./infrastructure/mail/mail.module";
import { AuditModule } from "./modules/audit/audit.module";
import { AuthModule } from "./modules/iam/auth/auth.module";
import { HealthModule } from "./modules/health/health.module";
import { PermissionsModule } from "./modules/iam/permissions/permissions.module";
import { ProfilesModule } from "./modules/iam/profiles/profiles.module";
import { RolesModule } from "./modules/iam/roles/roles.module";
import { UsersModule } from "./modules/iam/users/users.module";
import { FileModule } from "./modules/file/file/file.module";

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    AppConfigModule,
    LoggerModule,
    CacheModule,
    MailModule,
    DatabaseModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    FileModule,
    ProfilesModule,
    AuthModule,
    HealthModule,
    AuditModule,
  ],
})
export class AppModule {}
