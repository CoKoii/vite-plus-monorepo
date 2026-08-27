import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import type { HttpAdapterHost } from "@nestjs/core";

// 全局异常过滤器：统一错误响应格式并记录日志
@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name);
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}
  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    // 获取 HTTP 上下文
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const httpStatus =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // 构造统一错误响应体
    const responseBody = {
      code: httpStatus,
      requestId: request.id,
      message: exception instanceof HttpException ? exception.message : "Internal server error",
    };

    // 构造日志响应体
    const loggerResponseBody = {
      requestId: request.id,
      method: request.method,
      url: request.url,
      statusCode: httpStatus,
      message: responseBody.message,
      timestamp: new Date().toISOString(),
    };
    // 记录错误日志
    this.logger.error(loggerResponseBody);

    // 返回错误响应
    httpAdapter.reply(response, responseBody, httpStatus);
  }
}
