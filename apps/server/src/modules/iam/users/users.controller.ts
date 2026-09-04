import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";

import { PaginationQuery } from "../../../common/dto/pagination.dto";
import { ParseIdPipe } from "../../../common/pipes/parse-id.pipe";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { UpdateUserRolesDto } from "./dto/update-user-roles.dto";
import { User } from "./entities/user.entity";
import { UsersService } from "./users.service";

/** 用户管理接口，含角色分配和缓存清理 */
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Permissions("iam:user:read")
  @Get()
  findAll(@Query() query: PaginationQuery) {
    return this.usersService.findAll(query);
  }

  @Permissions("iam:user:read")
  @Get(":id")
  findById(@Param("id", ParseIdPipe) id: number) {
    return this.usersService.findByIdOrThrow(id);
  }

  @Permissions("iam:user:role:assign")
  @Patch(":id/roles")
  updateRoles(
    @CurrentUser() actor: User,
    @Param("id", ParseIdPipe) id: number,
    @Body() dto: UpdateUserRolesDto,
  ) {
    return this.usersService.updateRoles(actor.id, id, dto.roleIds);
  }
}
