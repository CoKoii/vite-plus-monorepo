import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query } from "@nestjs/common";

import { PaginationQuery } from "../../../common/dto/pagination.dto";
import { AuthorizationService } from "../auth/authorization.service";
import { UpdateUserRolesDto } from "./dto/update-user-roles.dto";
import { UsersService } from "./users.service";

/** 用户管理接口，含角色分配和缓存清理 */
@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Get()
  findAll(@Query() query: PaginationQuery) {
    return this.usersService.findAll(query);
  }

  @Get(":id")
  findById(@Param("id", ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Patch(":id/roles")
  async updateRoles(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateUserRolesDto) {
    const user = await this.usersService.updateRoles(id, dto.roleIds);
    // 用户角色变更，清除该用户的权限缓存
    await this.authorizationService.clearCache(id);
    return user;
  }
}
