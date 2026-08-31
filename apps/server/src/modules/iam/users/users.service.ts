import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { PaginatedResult, PaginationQuery } from "../../../common/dto/pagination.dto";
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
  ) {}

  findByEmail(email: string, selectPassword = false) {
    const qb = this.userRepository.createQueryBuilder("user").where("user.email = :email", { email });
    if (selectPassword) qb.addSelect("user.password");
    return qb.getOne();
  }

  findById(id: number) {
    return this.userRepository.findOne({
      where: { id },
      relations: { roles: { permissions: true } },
    });
  }

  create(email: string, password: string) {
    return this.userRepository.save(this.userRepository.create({ email, password }));
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

  async updateRoles(id: number, roleIds: number[]) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: { roles: true },
    });
    if (!user) throw new NotFoundException("用户不存在");

    user.roles = roleIds.length
      ? await this.roleRepository.findBy({ id: In(roleIds) })
      : [];
    return this.userRepository.save(user);
  }
}
