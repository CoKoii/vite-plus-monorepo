import { SetMetadata } from "@nestjs/common";

export const PERMISSIONS_KEY = "permissions";

/** 标记路由需要的权限码列表，配合 PermissionsGuard 使用 */
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);
