import type { UserInfo } from "@vben/types";

import { requestClient } from "#/api/request";

/**
 * 获取用户信息
 */
export async function getUserInfoApi() {
  const profile = await requestClient.get<UserInfo & { nickname: string }>(
    "/profiles/me",
  );
  return {
    ...profile,
    realName: profile.nickname,
  };
}
