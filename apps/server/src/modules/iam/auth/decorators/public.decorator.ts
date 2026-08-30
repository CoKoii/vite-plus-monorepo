import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

/** 标记接口为公开，跳过全局 JWT 校验 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
