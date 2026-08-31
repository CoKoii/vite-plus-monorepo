import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Cache } from "cache-manager";
import { Repository } from "typeorm";

import { User } from "../users/entities/user.entity";

const CACHE_TTL = 5 * 60 * 1000;

interface RoleVersions {
  [roleId: number]: number;
}

interface PermsCacheEntry {
  roleVersions: RoleVersions;
  data: string[];
}

@Injectable()
export class AuthorizationService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  /** 获取指定角色的版本号 */
  private async getRoleVersion(roleId: number): Promise<number> {
    const v = await this.cache.get<number>(`authz:role:version:${roleId}`);
    return v ?? 0;
  }

  /** 角色权限变更时调用，仅该角色版本 +1 */
  async incrementRoleVersion(roleId: number) {
    const v = await this.getRoleVersion(roleId);
    await this.cache.set(`authz:role:version:${roleId}`, v + 1, CACHE_TTL);
  }

  /** 获取用户角色编码集合 */
  async getRoles(userId: number) {
    const cacheKey = `authz:roles:${userId}`;
    const cached = await this.cache.get<string[]>(cacheKey);
    if (cached) return new Set(cached);

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { roles: true },
    });
    if (!user) return new Set<string>();

    const codes = user.roles.filter((r) => r.status === 1).map((r) => r.code);
    await this.cache.set(cacheKey, codes, CACHE_TTL);
    return new Set(codes);
  }

  /** 获取用户权限码集合（角色级版本号校验） */
  async getPermissions(userId: number) {
    const cacheKey = `authz:perms:${userId}`;
    const cached = await this.cache.get<PermsCacheEntry>(cacheKey);

    if (cached) {
      // 逐角色校验版本号——只有版本变化的角色才需要重算
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: { roles: true },
      });
      if (user) {
        const activeRoles = user.roles.filter((r) => r.status === 1);
        const allMatch = await Promise.all(
          activeRoles.map(async (r) => {
            const currentVersion = await this.getRoleVersion(r.id);
            return cached.roleVersions[r.id] === currentVersion;
          }),
        );
        if (allMatch.every(Boolean)) return new Set(cached.data);
      }
    }

    // 缓存失效或不存在，重新计算
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { roles: { permissions: true } },
    });
    if (!user) return new Set<string>();

    const activeRoles = user.roles.filter((r) => r.status === 1);
    const roleVersions: RoleVersions = {};
    await Promise.all(
      activeRoles.map(async (r) => {
        roleVersions[r.id] = await this.getRoleVersion(r.id);
      }),
    );

    const codes = activeRoles.flatMap(
      (r) => r.permissions?.filter((p) => p.status === 1).map((p) => p.code) ?? [],
    );
    await this.cache.set(cacheKey, { roleVersions, data: codes }, CACHE_TTL);
    return new Set(codes);
  }

  /** 清除单个用户缓存（用户角色变更时调用） */
  async clearCache(userId: number) {
    await Promise.all([
      this.cache.del(`authz:perms:${userId}`),
      this.cache.del(`authz:roles:${userId}`),
    ]);
  }

  async hasPermissions(userId: number, required: string[]) {
    const perms = await this.getPermissions(userId);
    return required.every((p) => perms.has(p));
  }

  async hasRoles(userId: number, required: string[]) {
    const roles = await this.getRoles(userId);
    return required.some((r) => roles.has(r));
  }
}
