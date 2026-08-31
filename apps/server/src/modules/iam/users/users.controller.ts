import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
} from "@nestjs/common";

import { AuthorizationService } from "../auth/authorization.service";
import { UpdateUserRolesDto } from "./dto/update-user-roles.dto";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  findById(@Param("id", ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Patch(":id/roles")
  async updateRoles(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateUserRolesDto,
  ) {
    const user = await this.usersService.updateRoles(id, dto.roleIds);
    await this.authorizationService.clearCache(id);
    return user;
  }
}
