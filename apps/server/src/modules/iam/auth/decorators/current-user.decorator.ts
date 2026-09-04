import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

import type { User } from "../../users/entities/user.entity";

/** 从请求中提取当前登录用户对象 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user?: User }>();
  return request.user;
});
