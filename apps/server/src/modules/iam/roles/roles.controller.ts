import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";

import { PaginationQuery } from "../../../common/dto/pagination.dto";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { RolesService } from "./roles.service";

@Controller("roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  findAll(@Query() query: PaginationQuery) {
    return this.rolesService.findAll(query);
  }

  @Get(":id")
  findById(@Param("id", ParseIntPipe) id: number) {
    return this.rolesService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Delete(":id")
  delete(@Param("id", ParseIntPipe) id: number) {
    return this.rolesService.delete(id);
  }
}
