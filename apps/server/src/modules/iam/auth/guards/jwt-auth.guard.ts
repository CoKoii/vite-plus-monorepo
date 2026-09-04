/** 全局 JWT 守卫，标记 @Public() 的接口跳过校验 */
import { type ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";

import {
  AuthenticationRequiredException,
  BusinessException,
} from "../../../../common/errors/business.exception";
import type { User } from "../../users/entities/user.entity";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

/** 全局 JWT 守卫，标记 @Public() 的接口跳过校验 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  /** JWT 校验失败时统一返回 401 */
  override handleRequest<TUser = User>(
    err: unknown,
    user: TUser | undefined,
    _info: unknown,
  ): TUser {
    if (err || !user) {
      if (err instanceof BusinessException) throw err;
      throw new AuthenticationRequiredException();
    }
    return user;
  }
}
