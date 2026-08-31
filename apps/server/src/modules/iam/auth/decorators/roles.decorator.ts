import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "roles";

/** 标记路由需要的角色编码列表，配合 RolesGuard 使用 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
