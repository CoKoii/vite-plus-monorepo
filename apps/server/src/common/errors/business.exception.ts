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

export class MailServiceDisabledException extends BusinessException {
  constructor(message = "邮件服务未启用") {
    super(ErrorCode.SERVICE_UNAVAILABLE, message, HttpStatus.SERVICE_UNAVAILABLE);
  }
}

export class InfrastructureUnavailableException extends BusinessException {
  constructor(message = "基础设施服务不可用") {
    super(ErrorCode.SERVICE_UNAVAILABLE, message, HttpStatus.SERVICE_UNAVAILABLE);
  }
}

export class FeatureDisabledException extends BusinessException {
  constructor(message = "当前功能未启用") {
    super(ErrorCode.FEATURE_DISABLED, message, HttpStatus.BAD_REQUEST);
  }
}

export class ValidationException extends BusinessException {
  constructor(message = "请求参数无效") {
    super(ErrorCode.VALIDATION_ERROR, message, HttpStatus.BAD_REQUEST);
  }
}

export class ResourceNotFoundException extends BusinessException {
  constructor(message = "请求的资源不存在") {
    super(ErrorCode.NOT_FOUND, message, HttpStatus.NOT_FOUND);
  }
}

export class AuthenticationRequiredException extends BusinessException {
  constructor(message = "请先登录") {
    super(ErrorCode.UNAUTHORIZED, message, HttpStatus.UNAUTHORIZED);
  }
}

export class PermissionDeniedException extends BusinessException {
  constructor(message = "没有权限执行该操作") {
    super(ErrorCode.FORBIDDEN, message, HttpStatus.FORBIDDEN);
  }
}

export class ConfigurationException extends BusinessException {
  constructor(message = "系统配置无效") {
    super(ErrorCode.INTERNAL_ERROR, message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class BootstrapException extends BusinessException {
  constructor(message = "系统初始化失败") {
    super(ErrorCode.INTERNAL_ERROR, message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class EmailAlreadyExistsException extends BusinessException {
  constructor(message = "邮箱已被注册") {
    super(ErrorCode.AUTH_EMAIL_ALREADY_EXISTS, message, HttpStatus.CONFLICT);
  }
}

export class ResourceConflictException extends BusinessException {
  constructor(message = "资源已存在") {
    super(ErrorCode.CONFLICT, message, HttpStatus.CONFLICT);
  }
}

export class InvalidCredentialsException extends BusinessException {
  constructor(message = "邮箱或密码错误") {
    super(ErrorCode.AUTH_INVALID_CREDENTIALS, message, HttpStatus.UNAUTHORIZED);
  }
}

export class AccountDisabledException extends BusinessException {
  constructor(message = "账户已被禁用") {
    super(ErrorCode.AUTH_ACCOUNT_DISABLED, message, HttpStatus.FORBIDDEN);
  }
}

export class TokenInvalidException extends BusinessException {
  constructor(message = "登录凭证无效或已失效，请重新登录") {
    super(ErrorCode.AUTH_TOKEN_INVALID, message, HttpStatus.UNAUTHORIZED);
  }
}

export class PasswordCodeInvalidException extends BusinessException {
  constructor(message = "密码验证码错误或已过期") {
    super(ErrorCode.AUTH_PASSWORD_CODE_INVALID, message, HttpStatus.BAD_REQUEST);
  }
}

export class EmailRequiredException extends BusinessException {
  constructor(message = "账户未绑定邮箱") {
    super(ErrorCode.AUTH_EMAIL_REQUIRED, message, HttpStatus.BAD_REQUEST);
  }
}

export class PasswordUnchangedException extends BusinessException {
  constructor(message = "新密码不能与当前密码相同") {
    super(ErrorCode.AUTH_PASSWORD_UNCHANGED, message, HttpStatus.BAD_REQUEST);
  }
}
