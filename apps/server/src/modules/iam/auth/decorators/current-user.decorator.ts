import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

/** 从请求中提取当前登录用户对象 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: any }>();
    return request.user;
  },
);
