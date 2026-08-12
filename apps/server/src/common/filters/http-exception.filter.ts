import {
  Catch,
  HttpException,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private logger: Logger) {}
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    // 响应 请求对象
    const response = ctx.getResponse();
    // http 状态码
    const status = exception.getStatus();
    this.logger.error(exception.message, exception.stack);
    response.status(status).send({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: exception.message || HttpException.name,
    });
  }
}
