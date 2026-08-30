import { type ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";
import { AuthorizationService } from "../authorization.service";

/** 权限校验守卫，通过 AuthorizationService 查库校验 */
@Injectable()
export class PermissionsGuard {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const { user } = context.switchToHttp().getRequest<{ user?: { id: number } }>();
    // 没有用户（如 @Public() 路由）但要求权限 → 拒绝
    if (!user) throw new ForbiddenException("没有足够的权限");
    return this.authorizationService.hasPermissions(user.id, required);
  }
}
