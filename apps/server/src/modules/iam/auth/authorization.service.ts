import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { User } from "../users/entities/user.entity";

@Injectable()
export class AuthorizationService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /** 获取用户权限码集合 */
  async getPermissions(userId: number): Promise<Set<string>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { roles: { permissions: true } },
    });
    if (!user) return new Set();

    const codes = user.roles.flatMap((r) => r.permissions?.map((p) => p.code) ?? []);
    return new Set(codes);
  }

  /** 获取用户角色编码集合 */
  async getRoles(userId: number): Promise<Set<string>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { roles: true },
    });
    if (!user) return new Set();

    return new Set(user.roles.map((r) => r.code));
  }

  /** 校验用户是否拥有所有指定权限 */
  async hasPermissions(userId: number, required: string[]): Promise<boolean> {
    const perms = await this.getPermissions(userId);
    return required.every((p) => perms.has(p));
  }

  /** 校验用户是否拥有任一指定角色 */
  async hasRoles(userId: number, required: string[]): Promise<boolean> {
    const roles = await this.getRoles(userId);
    return required.some((r) => roles.has(r));
  }
}
