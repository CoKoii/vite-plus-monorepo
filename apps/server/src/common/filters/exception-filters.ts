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

// ─── 工具函数 ─────────────────────────────────────────────────────

function resolveErrorCode(status: HttpStatus): ErrorCode {
  // 400: HTTP 叫 BAD_REQUEST，我们用 VALIDATION_ERROR
  if (status === HttpStatus.BAD_REQUEST) return ErrorCode.VALIDATION_ERROR;
  // 动态推导：HttpStatus[404] → "NOT_FOUND" → ErrorCode.NOT_FOUND
  const name = HttpStatus[status];
  if (typeof name === "string" && name in ErrorCode)
    return ErrorCode[name as keyof typeof ErrorCode];
  return ErrorCode.UNKNOWN_ERROR;
}

/* 提取请求和响应 */
function getCtx(host: ArgumentsHost) {
  const ctx = host.switchToHttp();
  return {
    req: ctx.getRequest<{ id?: string; method: string; url: string }>(),
    res: ctx.getResponse<any>(),
  };
}

// ─── 业务异常 ─────────────────────────────────────────────────────

@Catch(BusinessException)
export class BusinessExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(BusinessExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: BusinessException, host: ArgumentsHost) {
    const { req, res } = getCtx(host);
    this.logger.warn({
      requestId: req.id,
      method: req.method,
      url: req.url,
      statusCode: exception.httpStatus,
      code: exception.code,
      message: exception.message,
    });
    this.httpAdapterHost.httpAdapter.reply(
      res,
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
    const { req, res } = getCtx(host);
    const status = exception.getStatus() as HttpStatus;
    const resp = exception.getResponse();

    let code: string;
    let message: string;

    if (typeof resp === "string") {
      code = resolveErrorCode(status);
      message = resp;
    } else {
      const { code: c, message: m } = resp as { code?: string; message?: string | string[] };
      code = c ?? resolveErrorCode(status);
      message = Array.isArray(m) ? m.join("; ") : (m ?? exception.message);
    }

    this.logger.warn({
      requestId: req.id,
      method: req.method,
      url: req.url,
      statusCode: status,
      code,
      message,
    });
    this.httpAdapterHost.httpAdapter.reply(
      res,
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
    const { req, res } = getCtx(host);
    if (res.sent) return;
    this.logger.error({
      requestId: req.id,
      method: req.method,
      url: req.url,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.INTERNAL_ERROR,
      exception,
    });
    this.httpAdapterHost.httpAdapter.reply(
      res,
      {
        code: ErrorCode.INTERNAL_ERROR,
        message: "Internal server error",
        requestId: req.id ?? null,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
