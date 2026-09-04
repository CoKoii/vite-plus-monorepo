import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";

import { PaginationQuery } from "../../../common/dto/pagination.dto";
import { ParseIdPipe } from "../../../common/pipes/parse-id.pipe";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { RolesService } from "./roles.service";

/** 角色管理 CRUD 接口 */
@Controller("roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Permissions("iam:role:read")
  @Get()
  findAll(@Query() query: PaginationQuery) {
    return this.rolesService.findAll(query);
  }

  @Permissions("iam:role:read")
  @Get(":id")
  findById(@Param("id", ParseIdPipe) id: number) {
    return this.rolesService.findById(id);
  }

  @Roles("super_admin")
  @Permissions("iam:role:create")
  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Roles("super_admin")
  @Permissions("iam:role:update")
  @Patch(":id")
  update(@Param("id", ParseIdPipe) id: number, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Roles("super_admin")
  @Permissions("iam:role:delete")
  @Delete(":id")
  delete(@Param("id", ParseIdPipe) id: number) {
    return this.rolesService.delete(id);
  }
}
