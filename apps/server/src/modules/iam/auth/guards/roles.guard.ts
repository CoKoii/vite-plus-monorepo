import { type ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { ROLES_KEY } from "../decorators/roles.decorator";
import { AuthorizationService } from "../authorization.service";

/** 角色校验守卫，通过 AuthorizationService 查库校验 */
@Injectable()
export class RolesGuard {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const { user } = context.switchToHttp().getRequest<{ user: { id: number } }>();
    const ok = await this.authorizationService.hasRoles(user.id, required);
    if (!ok) throw new ForbiddenException("没有足够的角色权限");
    return true;
  }
}
