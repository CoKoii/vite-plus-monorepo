import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

import type { User } from "../../users/entities/user.entity";

/** 从请求中提取当前登录用户 */
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest<{ user: User }>().user;
    return data ? user?.[data] : user;
  },
);
