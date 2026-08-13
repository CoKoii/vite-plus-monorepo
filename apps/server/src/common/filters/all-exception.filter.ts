import {
  Catch,
  HttpException,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
  type LoggerService,
} from "@nestjs/common";
import type { HttpAdapterHost } from "@nestjs/core";

// 全局异常过滤器：统一错误响应格式并记录日志
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: LoggerService,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}
  catch(exception: HttpException, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    // 已知业务异常取自身状态码，未知异常统一 500
    const httpStatus =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // 响应体附带请求上下文（header/query/body/ip），便于排查问题
    const responseBody = {
      headers: request.headers,
      query: request.query,
      params: request.params,
      body: request.body,
      timestamp: new Date().toISOString(),
      ip: request.ip,
      exception: exception["name"],
      error: exception["response"] || "服务器异常",
    };
    this.logger.error("[toimc]", responseBody);
    httpAdapter.reply(response, responseBody, httpStatus);
  }
}
