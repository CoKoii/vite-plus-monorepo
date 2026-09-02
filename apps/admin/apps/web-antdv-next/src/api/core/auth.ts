import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken: string;
    refreshToken: string;
  }

  export interface TokenPair {
    accessToken: string;
    refreshToken: string;
  }

  export interface ApiResponse<T> {
    code: number;
    data: T;
    requestId: string;
  }
}

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/login', data);
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi(refreshToken: string) {
  const response = await baseRequestClient.instance.post<
    AuthApi.ApiResponse<AuthApi.TokenPair>
  >('/auth/refresh', { refreshToken });
  return response.data.data;
}

/**
 * 退出登录
 */
export async function logoutApi(refreshToken: string, accessToken: string) {
  await baseRequestClient.instance.post<AuthApi.ApiResponse<null>>(
    '/auth/logout',
    { refreshToken },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
}
