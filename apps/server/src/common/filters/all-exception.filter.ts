import {
  Catch,
  HttpException,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
  type LoggerService,
} from "@nestjs/common";
import type { HttpAdapterHost } from "@nestjs/core";
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: LoggerService,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}
  catch(exception: HttpException, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    // 响应 请求对象
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    // http 状态码
    const httpStatus =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

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
