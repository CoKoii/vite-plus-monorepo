import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "../auth/auth.module";
import { Role } from "../roles/entities/role.entity";
import { Permission } from "./entities/permission.entity";
import { PermissionsController } from "./permissions.controller";
import { PermissionsService } from "./permissions.service";

@Module({
  imports: [TypeOrmModule.forFeature([Permission, Role]), AuthModule],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
