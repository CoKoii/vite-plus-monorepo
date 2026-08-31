import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { PaginatedResult, PaginationQuery } from "../../../common/dto/pagination.dto";
import { AuthorizationService } from "../auth/authorization.service";
import { Role } from "../roles/entities/role.entity";
import { CreatePermissionDto } from "./dto/create-permission.dto";
import { UpdatePermissionDto } from "./dto/update-permission.dto";
import { Permission } from "./entities/permission.entity";

/** 权限管理服务，禁用/删除权限时自动传播到关联角色的版本号 */
@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async findAll(query: PaginationQuery): Promise<PaginatedResult<Permission>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const [items, total] = await this.permissionRepository.findAndCount({
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
    const permission = await this.permissionRepository.findOne({ where: { id } });
    if (!permission) throw new NotFoundException("权限不存在");
    return permission;
  }

  create(dto: CreatePermissionDto) {
    return this.permissionRepository.save(
      this.permissionRepository.create(dto),
    );
  }

  async update(id: number, dto: UpdatePermissionDto) {
    const permission = await this.permissionRepository.findOne({ where: { id } });
    if (!permission) throw new NotFoundException("权限不存在");

    const oldStatus = permission.status;
    Object.assign(permission, dto);
    const saved = await this.permissionRepository.save(permission);

    // 状态变更（启用/禁用）→ 所有包含该权限的角色版本号 +1
    if (dto.status !== undefined && dto.status !== oldStatus) {
      const roles = await this.roleRepository.find({
        where: { permissions: { id } },
      });
      await Promise.all(
        roles.map((r) => this.authorizationService.incrementRoleVersion(r.id)),
      );
    }
    return saved;
  }

  async delete(id: number) {
    const permission = await this.permissionRepository.findOne({ where: { id } });
    if (!permission) throw new NotFoundException("权限不存在");

    // 先找出关联角色递增版本号，再删除权限
    const roles = await this.roleRepository.find({
      where: { permissions: { id } },
    });
    await this.permissionRepository.remove(permission);
    await Promise.all(
      roles.map((r) => this.authorizationService.incrementRoleVersion(r.id)),
    );
  }
}
