import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, QueryFailedError, Repository } from "typeorm";

import { PaginatedResult, PaginationQuery } from "../../../common/dto/pagination.dto";
import { ResourceConflictException } from "../../../common/errors/business.exception";
import { AuthorizationService } from "../authorization/authorization.service";
import { Permission } from "../permissions/entities/permission.entity";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { Role } from "./entities/role.entity";

/** 角色管理服务，角色权限/状态变更时自动传播版本号使缓存失效 */
@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly authorizationService: AuthorizationService,
  ) {}

  /** 校验并获取权限列表，数量不匹配时拒绝 */
  private async findPermissionsOrThrow(ids: number[]) {
    if (!ids.length) return [];
    const permissions = await this.permissionRepository.findBy({ id: In(ids) });
    if (permissions.length !== ids.length) {
      throw new BadRequestException("存在无效的权限 ID");
    }
    return permissions;
  }

  async findAll(query: PaginationQuery): Promise<PaginatedResult<Role>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const [items, total] = await this.roleRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: "DESC" },
    });
    return {
      items,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: number) {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: { permissions: true },
    });
    if (!role) throw new NotFoundException("角色不存在");
    return role;
  }

  async create(dto: CreateRoleDto) {
    const role = this.roleRepository.create({
      name: dto.name,
      code: dto.code,
      description: dto.description,
      level: dto.level,
      status: dto.status,
    });
    if (dto.permissionIds?.length) {
      role.permissions = await this.findPermissionsOrThrow(dto.permissionIds);
    }
    try {
      await this.roleRepository.save(role);
    } catch (error) {
      if (error instanceof QueryFailedError && error.driverError?.code === "23505") {
        throw new ResourceConflictException("角色编码已存在");
      }
      throw error;
    }
    return "创建成功";
  }

  async update(id: number, dto: UpdateRoleDto) {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: { permissions: true },
    });
    if (!role) throw new NotFoundException("角色不存在");

    const oldStatus = role.status;
    if (dto.name !== undefined) role.name = dto.name;
    if (dto.description !== undefined) role.description = dto.description;
    if (dto.level !== undefined) {
      if (role.isSystem) throw new BadRequestException("系统角色等级不可修改");
      role.level = dto.level;
    }
    if (dto.permissionIds !== undefined) {
      role.permissions = dto.permissionIds.length
        ? await this.findPermissionsOrThrow(dto.permissionIds)
        : [];
    }
    if (dto.status !== undefined) {
      if (role.code === "super_admin" && dto.status === 0) {
        throw new BadRequestException("超级管理员角色不可禁用");
      }
      role.status = dto.status;
    }

    await this.roleRepository.save(role);

    // 影响授权的字段（status/permissions）变更 → 角色版本号 +1
    if ((dto.status !== undefined && dto.status !== oldStatus) || dto.permissionIds !== undefined) {
      await this.authorizationService.incrementRoleVersion(id);
    }
    return "更新成功";
  }

  /** 软删除角色，保留历史关联和审计意义。 */
  async delete(id: number) {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) throw new NotFoundException("角色不存在");
    if (role.isSystem) throw new BadRequestException("系统角色不可删除");

    const result = await this.roleRepository.softDelete(id);
    if (result.affected === 0) throw new NotFoundException("角色不存在");
    await this.authorizationService.incrementRoleVersion(id);
    return "删除成功";
  }
}
