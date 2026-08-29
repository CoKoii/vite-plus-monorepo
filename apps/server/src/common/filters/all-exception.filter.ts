import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import type { HttpAdapterHost } from "@nestjs/core";

import { ErrorCode } from "../errors/errorCode";

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  // 提取并统一异常中的业务错误码和消息
  private getError(exception: HttpException) {
    const response = exception.getResponse();

    if (typeof response === "string") {
      return {
        code: ErrorCode.VALIDATION_ERROR,
        message: response,
      };
    }

    const { code, message } = response as {
      code?: string;
      message?: string | string[];
    };

    return {
      code: code ?? ErrorCode.VALIDATION_ERROR,
      message: Array.isArray(message) ? message.join(", ") : (message ?? exception.message),
    };
  }

  // 捕获所有异常，统一响应格式并记录日志
  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // HTTP 状态码与业务错误码分别处理
    const httpStatus =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const error =
      exception instanceof HttpException
        ? this.getError(exception)
        : {
            code: ErrorCode.INTERNAL_ERROR,
            message: "Internal server error",
          };

    // 统一返回错误格式
    const responseBody = {
      code: error.code,
      requestId: request.id,
      message: error.message,
    };

    // 记录完整异常，便于通过 requestId 排查问题
    this.logger.error({
      requestId: request.id,
      method: request.method,
      url: request.url,
      statusCode: httpStatus,
      ...error,
      timestamp: new Date().toISOString(),
      exception,
    });

    httpAdapter.reply(response, responseBody, httpStatus);
  }
}
