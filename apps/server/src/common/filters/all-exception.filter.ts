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
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger();
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}
  catch(exception: unknown, host: ArgumentsHost) {
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
    };
    this.logger.error("[toimc]", responseBody);
    httpAdapter.reply(response, responseBody, httpStatus);
  }
}
