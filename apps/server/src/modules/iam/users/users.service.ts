import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { PaginatedResult, PaginationQuery } from "../../../common/dto/pagination.dto";
import { AuthorizationService } from "../authorization/authorization.service";
import { Role } from "../roles/entities/role.entity";
import { User } from "./entities/user.entity";

/** 用户管理服务，包含分页查询和角色分配 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly authorizationService: AuthorizationService,
  ) {}

  findByEmail(email: string, selectPassword = false) {
    const qb = this.userRepository
      .createQueryBuilder("user")
      .where("user.email = :email", { email: email.trim().toLowerCase() });
    if (selectPassword) qb.addSelect("user.passwordHash");
    return qb.getOne();
  }

  findById(id: number) {
    return this.userRepository.findOne({ where: { id } });
  }

  create(email: string, passwordHash: string) {
    return this.userRepository.save(
      this.userRepository.create({ email: email.trim().toLowerCase(), passwordHash }),
    );
  }

  /** 分页列表，只带角色不带权限，避免深层 JOIN */
  async findAll(query: PaginationQuery): Promise<PaginatedResult<User>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const [items, total] = await this.userRepository.findAndCount({
      relations: { roles: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: "DESC" },
    });
    return {
      items,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async updateRoles(actorId: number, targetUserId: number, roleIds: number[]) {
    const user = await this.userRepository.findOne({
      where: { id: targetUserId },
      relations: { roles: true },
    });
    if (!user) throw new NotFoundException("用户不存在");

    // 校验所有 roleId 存在且为启用状态
    const roles = roleIds.length ? await this.roleRepository.findBy({ id: In(roleIds) }) : [];
    if (roles.length !== roleIds.length) {
      throw new BadRequestException("存在无效的角色 ID");
    }
    const inactive = roles.filter((r) => r.status !== 1);
    if (inactive.length > 0) {
      throw new BadRequestException(
        `角色 [${inactive.map((r) => r.name).join(", ")}] 已禁用，无法分配`,
      );
    }

    await this.authorizationService.assertCanAssignRoles(actorId, user, roles);
    user.roles = roles;
    const updatedUser = await this.userRepository.save(user);
    await this.authorizationService.incrementUserVersion(targetUserId);
    await this.authorizationService.clearCache(targetUserId);
    return updatedUser;
  }
}
