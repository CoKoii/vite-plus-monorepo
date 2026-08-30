import { ValidationPipe, VersioningType, type LoggerService } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import "reflect-metadata";

import { AppModule } from "./app.module";
import {
  BusinessExceptionFilter,
  HttpExceptionFilter,
  UnknownExceptionFilter,
} from "./common/filters/exception-filters";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  const configService = app.get(ConfigService);
  const httpAdapterHost = app.get(HttpAdapterHost);

  // 使用 Winston 作为全局日志
  app.useLogger(app.get<LoggerService>(WINSTON_MODULE_NEST_PROVIDER));

  // 全局参数校验
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 全局异常过滤器
  app.useGlobalFilters(
    new UnknownExceptionFilter(httpAdapterHost),
    new HttpExceptionFilter(httpAdapterHost),
    new BusinessExceptionFilter(httpAdapterHost),
  );

  // 全局响应拦截器
  app.useGlobalInterceptors(new ResponseInterceptor());

  // 配置 CORS
  const corsOrigin = configService.getOrThrow<string>("CORS_ORIGIN");
  const corsOrigins =
    corsOrigin === "*" ? true : corsOrigin.split(",").map((origin) => origin.trim());
  app.enableCors({ origin: corsOrigins });

  // 全局 API 前缀
  app.setGlobalPrefix("api");

  // URI 版本控制，默认 v1
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });

  const port = configService.getOrThrow<number>("PORT");
  await app.listen(port);
}

void bootstrap();
