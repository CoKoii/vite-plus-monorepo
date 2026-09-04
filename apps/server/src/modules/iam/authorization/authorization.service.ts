import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Cache } from "cache-manager";
import { Repository } from "typeorm";

import { PermissionDeniedException } from "../../../common/errors/business.exception";
import { REDIS_CLIENT, type RedisClient } from "../../../infrastructure/cache/cache.module";
import { Role } from "../roles/entities/role.entity";
import { User } from "../users/entities/user.entity";

const CACHE_TTL = 5 * 60 * 1000;

interface RoleVersions {
  [roleId: number]: number;
}

interface PermsCacheEntry {
  userVersion: number;
  roleVersions: RoleVersions;
  data: string[];
}

interface RolesCacheEntry {
  userVersion: number;
  roleIds: number[];
  roleVersions: RoleVersions;
  data: string[];
}

/** 授权服务：角色和权限校验、缓存及缓存失效。 */
@Injectable()
export class AuthorizationService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: RedisClient,
  ) {}

  private async getRoleVersions(roleIds: number[]): Promise<number[]> {
    if (!roleIds.length) return [];
    const keys = roleIds.map((id) => `authz:role:version:${id}`);
    const values = await this.redisClient.mGet(keys);
    return values.map((v) => (v !== null ? Number(v) : 0));
  }

  private async getUserVersion(userId: number): Promise<number> {
    const [value] = await this.redisClient.mGet([`authz:user:version:${userId}`]);
    return value !== null ? Number(value) : 0;
  }

  async incrementUserVersion(userId: number) {
    await this.redisClient.incr(`authz:user:version:${userId}`);
  }

  async incrementRoleVersion(roleId: number) {
    await this.redisClient.incr(`authz:role:version:${roleId}`);
  }

  async getRoles(userId: number) {
    const cacheKey = `authz:roles:${userId}`;
    const userVersion = await this.getUserVersion(userId);
    const cached = await this.cache.get<RolesCacheEntry>(cacheKey);
    if (cached?.roleIds && cached.roleVersions && cached.userVersion === userVersion) {
      const versions = await this.getRoleVersions(cached.roleIds);
      const allMatch = cached.roleIds.every((id, i) => cached.roleVersions[id] === versions[i]);
      if (allMatch) return new Set(cached.data);
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { roles: true },
    });
    if (!user) return new Set<string>();

    const activeRoles = user.roles.filter((role) => role.status === 1);
    const roleIds = activeRoles.map((role) => role.id);
    const versions = await this.getRoleVersions(roleIds);
    const roleVersions: RoleVersions = {};
    roleIds.forEach((id, i) => {
      roleVersions[id] = versions[i] ?? 0;
    });
    const codes = activeRoles.map((role) => role.code);
    await this.cache.set(cacheKey, { userVersion, roleIds, roleVersions, data: codes }, CACHE_TTL);
    return new Set(codes);
  }

  async getPermissions(userId: number) {
    const permsKey = `authz:perms:${userId}`;
    const rolesKey = `authz:user:roles:${userId}`;
    const userVersion = await this.getUserVersion(userId);
    const [cachedPerms, cachedRoleIds] = await Promise.all([
      this.cache.get<PermsCacheEntry>(permsKey),
      this.cache.get<number[]>(rolesKey),
    ]);

    // 空角色列表也是有效缓存，避免无角色用户每次都回源数据库。
    if (cachedPerms?.userVersion === userVersion && cachedRoleIds) {
      const versions = await this.getRoleVersions(cachedRoleIds);
      const allMatch = cachedRoleIds.every((id, i) => cachedPerms.roleVersions[id] === versions[i]);
      if (allMatch) return new Set(cachedPerms.data);
    }

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

    await Promise.all([
      this.cache.set(permsKey, { userVersion, roleVersions, data: codes }, CACHE_TTL),
      this.cache.set(rolesKey, roleIds, CACHE_TTL),
    ]);
    return new Set(codes);
  }

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

  /** 角色只能由不低于目标用户的上级委派，且不能委派同级或更高角色。 */
  async assertCanAssignRoles(actorId: number, targetUser: User, requestedRoles: Role[]) {
    const actor = await this.userRepository.findOne({
      where: { id: actorId },
      relations: { roles: true },
    });
    if (!actor) throw new PermissionDeniedException("无权分配角色");
    if (actor.id === targetUser.id) throw new PermissionDeniedException("不能修改自己的角色");

    const actorLevel = Math.max(
      ...actor.roles.filter((role) => role.status === 1).map((role) => role.level),
      -1,
    );
    const targetLevel = Math.max(...targetUser.roles.map((role) => role.level), -1);
    const requestedLevel = Math.max(...requestedRoles.map((role) => role.level), -1);

    if (actorLevel <= targetLevel || requestedLevel >= actorLevel) {
      throw new PermissionDeniedException("不能管理同级或更高等级的角色");
    }
  }
}
