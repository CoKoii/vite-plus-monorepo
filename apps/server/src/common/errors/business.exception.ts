import { HttpStatus } from "@nestjs/common";

import { ErrorCode } from "./errorCode";

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

export class TooManyRequestsException extends BusinessException {
  constructor(message = "验证码发送过于频繁，请稍后再试") {
    super(ErrorCode.TOO_MANY_REQUESTS, message, HttpStatus.TOO_MANY_REQUESTS);
  }
}
export class CaptchaInvalidException extends BusinessException {
  constructor(message = "验证码错误") {
    super(ErrorCode.AUTH_CAPTCHA_INVALID, message, HttpStatus.BAD_REQUEST);
  }
}
export class MailSendFailedException extends BusinessException {
  constructor(message = "验证码发送失败，请稍后重试") {
    super(ErrorCode.MAIL_SEND_FAILED, message, HttpStatus.SERVICE_UNAVAILABLE);
  }
}

export class EmailAlreadyExistsException extends BusinessException {
  constructor(message = "邮箱已被注册") {
    super(ErrorCode.AUTH_EMAIL_ALREADY_EXISTS, message, HttpStatus.CONFLICT);
  }
}

export class InvalidCredentialsException extends BusinessException {
  constructor(message = "邮箱或密码错误") {
    super(ErrorCode.AUTH_INVALID_CREDENTIALS, message, HttpStatus.UNAUTHORIZED);
  }
}

export class TokenInvalidException extends BusinessException {
  constructor(message = "Token 无效，请重新登录") {
    super(ErrorCode.AUTH_TOKEN_INVALID, message, HttpStatus.UNAUTHORIZED);
  }
}
