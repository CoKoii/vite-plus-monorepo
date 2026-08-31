import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "../auth/auth.module";
import { Permission } from "../permissions/entities/permission.entity";
import { PermissionsModule } from "../permissions/permissions.module";
import { RolesController } from "./roles.controller";
import { RolesService } from "./roles.service";
import { Role } from "./entities/role.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission]),
    AuthModule,
    PermissionsModule,
  ],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
