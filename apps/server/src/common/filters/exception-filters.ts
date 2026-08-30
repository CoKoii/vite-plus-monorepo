import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import type { HttpAdapterHost } from "@nestjs/core";

import { BusinessException } from "../errors/business.exception";
import { ErrorCode } from "../errors/errorCode";

/** 动态推导 HTTP 状态码 → ErrorCode */
function statusToErrorCode(status: HttpStatus): ErrorCode {
  if (status === HttpStatus.BAD_REQUEST) return ErrorCode.VALIDATION_ERROR;
  const name = HttpStatus[status];
  if (typeof name === "string" && name in ErrorCode)
    return ErrorCode[name as keyof typeof ErrorCode];
  return ErrorCode.UNKNOWN_ERROR;
}

function getRequest(host: ArgumentsHost) {
  return host.switchToHttp().getRequest<{ id?: string; method: string; url: string }>();
}

// ─── 业务异常 ─────────────────────────────────────────────────────

@Catch(BusinessException)
export class BusinessExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(BusinessExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: BusinessException, host: ArgumentsHost) {
    const req = getRequest(host);
    this.logger.warn({ requestId: req.id, method: req.method, url: req.url, statusCode: exception.httpStatus, code: exception.code, message: exception.message });
    this.httpAdapterHost.httpAdapter.reply(
      host.switchToHttp().getResponse(),
      { code: exception.code, message: exception.message, requestId: req.id ?? null },
      exception.httpStatus,
    );
  }
}

// ─── 框架 HTTP 异常（404、400 等） ────────────────────────────────

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const req = getRequest(host);
    const status = exception.getStatus() as HttpStatus;
    const resp = exception.getResponse();

    let code: string;
    let message: string;

    if (typeof resp === "string") {
      code = statusToErrorCode(status);
      message = resp;
    } else {
      const body = resp as Record<string, any>;
      code = (body["code"] as string) ?? statusToErrorCode(status);
      message = Array.isArray(body["message"]) ? body["message"].join("; ") : (body["message"] ?? exception.message);
    }

    this.logger.warn({ requestId: req.id, method: req.method, url: req.url, statusCode: status, code, message });
    this.httpAdapterHost.httpAdapter.reply(
      host.switchToHttp().getResponse(),
      { code, message, requestId: req.id ?? null },
      status,
    );
  }
}

// ─── 兜底（未知异常 → 500） ──────────────────────────────────────

@Catch()
export class UnknownExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(UnknownExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<{ id?: string; method: string; url: string }>();
    const res = ctx.getResponse<any>();
    if (res.sent) return;
    this.logger.error({ requestId: req.id, method: req.method, url: req.url, statusCode: HttpStatus.INTERNAL_SERVER_ERROR, code: ErrorCode.INTERNAL_ERROR, exception });
    this.httpAdapterHost.httpAdapter.reply(
      res,
      { code: ErrorCode.INTERNAL_ERROR, message: "服务器内部错误", requestId: req.id ?? null },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
