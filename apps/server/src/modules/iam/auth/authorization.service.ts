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

/** 权限校验核心服务，角色级版本号缓存，热路径纯 Redis 零 DB 查询 */
@Injectable()
export class AuthorizationService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  /** 获取底层 Redis 客户端，用于原子操作 */
  private get redis() {
    return (this.cache.stores as any)[0]?.store?.client;
  }

  /** 批量获取角色版本号 */
  private async getRoleVersions(roleIds: number[]): Promise<number[]> {
    if (!roleIds.length) return [];
    const keys = roleIds.map((id) => `authz:role:version:${id}`);
    const values: (string | null)[] = await this.redis.mGet(keys);
    return values.map((v) => (v !== null ? Number(v) : 0));
  }

  /** 角色权限变更时原子递增版本号，不设 TTL */
  async incrementRoleVersion(roleId: number) {
    await this.redis.incr(`authz:role:version:${roleId}`);
  }

  /** 获取用户角色编码列表（缓存 5 分钟） */
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

  /** 获取用户权限码列表，热路径纯 Redis 零 DB 查询 */
  async getPermissions(userId: number) {
    const permsKey = `authz:perms:${userId}`;
    const rolesKey = `authz:user:roles:${userId}`;

    // 1. 读缓存
    const [cachedPerms, cachedRoleIds] = await Promise.all([
      this.cache.get<PermsCacheEntry>(permsKey),
      this.cache.get<number[]>(rolesKey),
    ]);

    // 2. 缓存命中 → 批量校验角色版本号，零 DB 查询
    if (cachedPerms && cachedRoleIds?.length) {
      const versions = await this.getRoleVersions(cachedRoleIds);
      const allMatch = cachedRoleIds.every((id, i) => cachedPerms.roleVersions[id] === versions[i]);
      if (allMatch) return new Set(cachedPerms.data);
    }

    // 3. 缓存失效或不存在，从 DB 重新计算
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { roles: { permissions: true } },
    });
    if (!user) return new Set<string>();

    const activeRoles = user.roles.filter((r) => r.status === 1);
    const roleIds = activeRoles.map((r) => r.id);
    const versions = await this.getRoleVersions(roleIds);
    const roleVersions: RoleVersions = {};
    roleIds.forEach((id, i) => {
      roleVersions[id] = versions[i] ?? 0;
    });

    const codes = activeRoles.flatMap(
      (r) => r.permissions?.filter((p) => p.status === 1).map((p) => p.code) ?? [],
    );

    // 4. 同时缓存权限结果和角色列表，下次校验不查 DB
    await Promise.all([
      this.cache.set(permsKey, { roleVersions, data: codes }, CACHE_TTL),
      this.cache.set(rolesKey, roleIds, CACHE_TTL),
    ]);
    return new Set(codes);
  }

  /** 清除单个用户缓存（用户角色变更时调用） */
  async clearCache(userId: number) {
    await Promise.all([
      this.cache.del(`authz:perms:${userId}`),
      this.cache.del(`authz:roles:${userId}`),
      this.cache.del(`authz:user:roles:${userId}`),
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
