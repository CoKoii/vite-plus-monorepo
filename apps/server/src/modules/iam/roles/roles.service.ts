import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { PaginatedResult, PaginationQuery } from "../../../common/dto/pagination.dto";
import { AuthorizationService } from "../auth/authorization.service";
import { Permission } from "../permissions/entities/permission.entity";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { Role } from "./entities/role.entity";

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly authorizationService: AuthorizationService,
  ) {}

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
    });
    if (dto.permissionIds?.length) {
      role.permissions = await this.permissionRepository.findBy({
        id: In(dto.permissionIds),
      });
    }
    return this.roleRepository.save(role);
  }

  async update(id: number, dto: UpdateRoleDto) {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: { permissions: true },
    });
    if (!role) throw new NotFoundException("角色不存在");

    if (dto.name !== undefined) role.name = dto.name;
    if (dto.code !== undefined) role.code = dto.code;
    if (dto.description !== undefined) role.description = dto.description;
    if (dto.permissionIds !== undefined) {
      role.permissions = dto.permissionIds.length
        ? await this.permissionRepository.findBy({ id: In(dto.permissionIds) })
        : [];
    }

    const saved = await this.roleRepository.save(role);
    // 权限变更 → 仅该角色版本 +1，只有拥有该角色的用户缓存会失效
    if (dto.permissionIds !== undefined) {
      await this.authorizationService.incrementRoleVersion(id);
    }
    return saved;
  }

  async delete(id: number) {
    const result = await this.roleRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException("角色不存在");
    await this.authorizationService.incrementRoleVersion(id);
  }
}
