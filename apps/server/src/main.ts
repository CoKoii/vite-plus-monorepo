import { ValidationPipe, VersioningType, type LoggerService } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import "reflect-metadata";

import { AppModule } from "./app.module";
import { AllExceptionFilter } from "./common/filters/all-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";

async function bootstrap() {
  // 创建 Fastify 应用
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  // 获取配置服务
  const configService = app.get(ConfigService);

  // 使用 Winston 作为全局日志实现
  app.useLogger(app.get<LoggerService>(WINSTON_MODULE_NEST_PROVIDER));

  // 全局参数校验
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // 全局异常过滤器
  app.useGlobalFilters(new AllExceptionFilter(app.get(HttpAdapterHost)));

  // 全局响应拦截器
  app.useGlobalInterceptors(new ResponseInterceptor());

  // 配置 CORS
  const corsOrigin = configService.getOrThrow<string>("CORS_ORIGIN");
  const corsOrigins =
    corsOrigin === "*" ? true : corsOrigin.split(",").map((origin) => origin.trim());

  app.enableCors({
    origin: corsOrigins,
  });

  // 配置全局 API 前缀
  app.setGlobalPrefix("api");

  // 启用 URI 版本控制，默认使用 v1
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });

  // 启动 HTTP 服务
  const port = configService.getOrThrow<number>("PORT");

  await app.listen(port);
}

void bootstrap();
