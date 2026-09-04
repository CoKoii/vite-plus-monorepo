/* 业务错误码：HTTP 状态码负责传输层，ErrorCode 负责描述具体业务错误 */
export enum ErrorCode {
  // ==================== 通用 ====================

  /** 请求参数校验失败 */
  VALIDATION_ERROR = "VALIDATION_ERROR",
  /** 未认证，需要先登录 */
  UNAUTHORIZED = "UNAUTHORIZED",
  /** 没有权限执行该操作 */
  FORBIDDEN = "FORBIDDEN",
  /** 请求的资源不存在 */
  NOT_FOUND = "NOT_FOUND",
  /** 请求与当前资源状态冲突 */
  CONFLICT = "CONFLICT",
  /** 请求过于频繁，被限流 */
  TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS",
  /** 依赖服务暂时不可用 */
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  /** 邮件发送失败 */
  MAIL_SEND_FAILED = "MAIL_SEND_FAILED",
  /** 服务器内部错误 */
  INTERNAL_ERROR = "INTERNAL_ERROR",
  /** 未知错误（兜底） */
  UNKNOWN_ERROR = "UNKNOWN_ERROR",

  // ==================== Auth ====================

  /** 邮箱或密码错误 */
  AUTH_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS",
  /** 邮箱已被注册 */
  AUTH_EMAIL_ALREADY_EXISTS = "AUTH_EMAIL_ALREADY_EXISTS",
  /** 邮箱格式不正确 */
  AUTH_EMAIL_INVALID = "AUTH_EMAIL_INVALID",
  /** 验证码错误 */
  AUTH_CAPTCHA_INVALID = "AUTH_CAPTCHA_INVALID",
  /** 验证码已过期 */
  AUTH_CAPTCHA_EXPIRED = "AUTH_CAPTCHA_EXPIRED",
  /** Token 无效 */
  AUTH_TOKEN_INVALID = "AUTH_TOKEN_INVALID",
  /** 账户已被禁用 */
  AUTH_ACCOUNT_DISABLED = "AUTH_ACCOUNT_DISABLED",
  /** Token 已过期，需重新登录 */
  AUTH_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED",
}
