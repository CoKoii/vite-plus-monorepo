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

  private getError(exception: HttpException) {
    const response = exception.getResponse();

    if (typeof response === "string") {
      return { code: ErrorCode.UNKNOWN_ERROR, message: response };
    }

    const { code, message } = response as {
      code?: string;
      message?: string | string[];
    };

    return {
      code: code ?? ErrorCode.UNKNOWN_ERROR,
      message: Array.isArray(message) ? message.join("; ") : (message ?? exception.message),
    };
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request: any = ctx.getRequest();
    const response = ctx.getResponse();

    const httpStatus =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const error =
      exception instanceof HttpException
        ? this.getError(exception)
        : { code: ErrorCode.INTERNAL_ERROR, message: "Internal server error" };

    const responseBody = {
      code: error.code,
      message: error.message,
      requestId: request.id ?? null,
    };

    this.logger.error({
      requestId: request.id,
      method: request.method,
      url: request.url,
      statusCode: httpStatus,
      code: error.code,
      message: error.message,
      exception,
    });

    httpAdapter.reply(response, responseBody, httpStatus);
  }
}
