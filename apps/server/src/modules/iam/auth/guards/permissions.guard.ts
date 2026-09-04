import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { AuthorizationService } from "../../authorization/authorization.service";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";

/** 权限校验守卫，通过 AuthorizationService 查库校验 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const { user } = context.switchToHttp().getRequest<{ user?: { id: number } }>();
    if (!user) return false;

    return this.authorizationService.hasPermissions(user.id, required);
  }
}
