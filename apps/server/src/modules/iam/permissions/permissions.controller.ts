import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";

import { PaginationQuery } from "../../../common/dto/pagination.dto";
import { ParseIdPipe } from "../../../common/pipes/parse-id.pipe";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { CreatePermissionDto } from "./dto/create-permission.dto";
import { UpdatePermissionDto } from "./dto/update-permission.dto";
import { PermissionsService } from "./permissions.service";

/** 权限管理 CRUD 接口 */
@Controller("permissions")
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Permissions("iam:permission:read")
  @Get()
  findAll(@Query() query: PaginationQuery) {
    return this.permissionsService.findAll(query);
  }

  @Permissions("iam:permission:read")
  @Get(":id")
  findById(@Param("id", ParseIdPipe) id: number) {
    return this.permissionsService.findById(id);
  }

  @Roles("super_admin")
  @Permissions("iam:permission:create")
  @Post()
  create(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.create(dto);
  }

  @Roles("super_admin")
  @Permissions("iam:permission:update")
  @Patch(":id")
  update(@Param("id", ParseIdPipe) id: number, @Body() dto: UpdatePermissionDto) {
    return this.permissionsService.update(id, dto);
  }

  @Roles("super_admin")
  @Permissions("iam:permission:delete")
  @Delete(":id")
  delete(@Param("id", ParseIdPipe) id: number) {
    return this.permissionsService.delete(id);
  }
}
