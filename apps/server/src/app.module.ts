import { Module } from "@nestjs/common";

import { AppConfigModule } from "./config/config.module";
import { CacheModule } from "./infrastructure/cache/cache.module";
import { DatabaseModule } from "./infrastructure/database/database.module";
import { LoggerModule } from "./infrastructure/logger/logger.module";
import { MailModule } from "./infrastructure/mail/mail.module";
import { AuthModule } from "./modules/iam/auth/auth.module";
import { PermissionsModule } from "./modules/iam/permissions/permissions.module";
import { ProfilesModule } from "./modules/iam/profiles/profiles.module";
import { RolesModule } from "./modules/iam/roles/roles.module";
import { UsersModule } from "./modules/iam/users/users.module";
import { FileModule } from "./modules/file/file/file.module";

@Module({
  imports: [
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
  ],
})
export class AppModule {}
