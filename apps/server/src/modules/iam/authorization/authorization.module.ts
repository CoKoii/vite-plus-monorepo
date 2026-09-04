import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CacheModule } from "../../../infrastructure/cache/cache.module";
import { User } from "../users/entities/user.entity";
import { AuthorizationService } from "./authorization.service";

@Module({
  imports: [CacheModule, TypeOrmModule.forFeature([User])],
  providers: [AuthorizationService],
  exports: [AuthorizationService],
})
export class AuthorizationModule {}
