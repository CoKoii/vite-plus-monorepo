import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { PaginatedResult, PaginationQuery } from "../../../common/dto/pagination.dto";
import { AuthorizationService } from "../auth/authorization.service";
import { Permission } from "../permissions/entities/permission.entity";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { Role } from "./entities/role.entity";

/** 角色管理服务，角色权限/状态/编码变更时自动传播版本号使缓存失效 */
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

    const oldStatus = role.status;
    if (dto.name !== undefined) role.name = dto.name;
    if (dto.code !== undefined) role.code = dto.code;
    if (dto.description !== undefined) role.description = dto.description;
    if (dto.permissionIds !== undefined) {
      role.permissions = dto.permissionIds.length
        ? await this.permissionRepository.findBy({ id: In(dto.permissionIds) })
        : [];
    }
    if (dto.status !== undefined) role.status = dto.status;

    const saved = await this.roleRepository.save(role);

    // 影响授权的字段（code/status/permissions）变更 → 角色版本号 +1
    const authorizationChanged =
      dto.code !== undefined ||
      (dto.status !== undefined && dto.status !== oldStatus) ||
      dto.permissionIds !== undefined;

    if (authorizationChanged) {
      await this.authorizationService.incrementRoleVersion(id);
    }
    return saved;
  }

  async delete(id: number) {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) throw new NotFoundException("角色不存在");

    // 已分配给用户的角色禁止物理删除，只允许禁用（status=0）
    const result = await this.roleRepository.query(
      'SELECT COUNT(*)::int AS cnt FROM user_roles_role WHERE "roleId" = $1',
      [id],
    );
    const userCount = result[0]?.cnt ?? 0;
    if (userCount > 0) {
      throw new BadRequestException("角色已被用户使用，请先禁用而不是删除");
    }

    await this.roleRepository.remove(role);
    await this.authorizationService.incrementRoleVersion(id);
  }
}
