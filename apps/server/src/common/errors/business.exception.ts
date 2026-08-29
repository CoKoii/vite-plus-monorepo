import { HttpStatus } from "@nestjs/common";

import { ErrorCode } from "./errorCode";

/* 业务异常基类：继承 Error 而非 HttpException，与框架异常完全分离 */
export class BusinessException extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message);
    this.name = "BusinessException";
  }
}

// ─── 具体业务异常 ────────────────────────────────────────────────

/* 验证码发送过于频繁 */
export class TooManyRequestsException extends BusinessException {
  constructor(message = "验证码发送过于频繁，请稍后再试") {
    super(ErrorCode.TOO_MANY_REQUESTS, message, HttpStatus.TOO_MANY_REQUESTS);
  }
}

/* 邮件发送失败 */
export class MailSendFailedException extends BusinessException {
  constructor(message = "验证码发送失败，请稍后重试") {
    super(ErrorCode.MAIL_SEND_FAILED, message, HttpStatus.SERVICE_UNAVAILABLE);
  }
}

/* 邮箱已被注册 */
export class EmailAlreadyExistsException extends BusinessException {
  constructor(message = "邮箱已被注册") {
    super(ErrorCode.AUTH_EMAIL_ALREADY_EXISTS, message, HttpStatus.CONFLICT);
  }
}

/* 邮箱格式不正确 */
export class EmailInvalidException extends BusinessException {
  constructor(message = "邮箱格式不正确") {
    super(ErrorCode.AUTH_EMAIL_INVALID, message, HttpStatus.BAD_REQUEST);
  }
}

/* 用户已存在 */
export class UserAlreadyExistsException extends BusinessException {
  constructor(message = "用户已存在") {
    super(ErrorCode.AUTH_EMAIL_ALREADY_EXISTS, message, HttpStatus.CONFLICT);
  }
}
