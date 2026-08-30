import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Cache } from "cache-manager";
import { Repository } from "typeorm";

import { User } from "../users/entities/user.entity";

const CACHE_TTL = 5 * 60 * 1000; // 5 分钟

@Injectable()
export class AuthorizationService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  /** 获取用户权限码集合（Redis 缓存，5 分钟失效） */
  async getPermissions(userId: number): Promise<Set<string>> {
    const cacheKey = `authz:perms:${userId}`;
    const cached = await this.cache.get<string[]>(cacheKey);
    if (cached) return new Set(cached);

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { roles: { permissions: true } },
    });
    if (!user) return new Set();

    const codes = user.roles.flatMap((r) => r.permissions?.map((p) => p.code) ?? []);
    await this.cache.set(cacheKey, codes, CACHE_TTL);
    return new Set(codes);
  }

  /** 获取用户角色编码集合（Redis 缓存，5 分钟失效） */
  async getRoles(userId: number): Promise<Set<string>> {
    const cacheKey = `authz:roles:${userId}`;
    const cached = await this.cache.get<string[]>(cacheKey);
    if (cached) return new Set(cached);

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { roles: true },
    });
    if (!user) return new Set();

    const codes = user.roles.map((r) => r.code);
    await this.cache.set(cacheKey, codes, CACHE_TTL);
    return new Set(codes);
  }

  /** 清除用户权限/角色缓存（角色变更时调用） */
  async clearCache(userId: number): Promise<void> {
    await Promise.all([
      this.cache.del(`authz:perms:${userId}`),
      this.cache.del(`authz:roles:${userId}`),
    ]);
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
