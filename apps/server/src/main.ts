import { randomUUID } from "node:crypto";

import {
  BadRequestException,
  ValidationPipe,
  VersioningType,
  type LoggerService,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import type { ValidationError } from "class-validator";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import "reflect-metadata";

import { AppModule } from "./app.module";
import {
  BusinessExceptionFilter,
  HttpExceptionFilter,
  UnknownExceptionFilter,
} from "./common/filters/exception-filters";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";

function formatValidationErrors(errors: ValidationError[], parent = ""): string[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const messages = Object.entries(error.constraints ?? {}).map(([name, rawMessage]) => {
      const limit = rawMessage.match(/\d+/)?.[0];
      const message =
        {
          isEmail: "必须是有效的邮箱地址",
          isString: "必须是字符串",
          isNotEmpty: "不能为空",
          minLength: `长度不能少于 ${limit ?? "要求的"} 个字符`,
          maxLength: `长度不能超过 ${limit ?? "要求的"} 个字符`,
          length: `长度必须为 ${limit ?? "要求的"} 个字符`,
          matches: "格式不正确",
          isInt: "必须是整数",
          min: `不能小于 ${limit ?? "要求的数值"}`,
          max: `不能大于 ${limit ?? "要求的数值"}`,
          isIn: "取值不合法",
          isArray: "必须是数组",
          arrayUnique: "不能包含重复值",
          whitelistValidation: "不允许传入此字段",
        }[name] ?? "参数无效";
      return `${field}: ${message}`;
    });
    return messages.length ? messages : formatValidationErrors(error.children ?? [], field);
  });
}

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      requestIdHeader: "x-request-id",
      genReqId: () => randomUUID(),
    }),
  );
  const configService = app.get(ConfigService);
  const httpAdapterHost = app.get(HttpAdapterHost);

  app.enableShutdownHooks();

  app.useLogger(app.get<LoggerService>(WINSTON_MODULE_NEST_PROVIDER));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) =>
        new BadRequestException({
          code: "VALIDATION_ERROR",
          message: formatValidationErrors(errors),
        }),
    }),
  );

  app.useGlobalFilters(
    new UnknownExceptionFilter(httpAdapterHost),
    new HttpExceptionFilter(httpAdapterHost),
    new BusinessExceptionFilter(httpAdapterHost),
  );

  app.useGlobalInterceptors(new ResponseInterceptor());

  const corsOrigin = configService.getOrThrow<string>("CORS_ORIGIN");
  app.enableCors({
    origin: corsOrigin === "*" ? true : corsOrigin.split(",").map((o) => o.trim()),
  });

  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });

  const port = configService.getOrThrow<number>("PORT");
  await app.listen(port);
}

void bootstrap();
