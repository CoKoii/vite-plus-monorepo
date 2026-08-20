import { VersioningType, type LoggerService } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import "reflect-metadata";

import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/all-exception.filter";

// 应用启动入口：注册全局中间件并监听端口
async function bootstrap() {
  // 基于 Fastify 创建应用，日志由 LoggerModule 统一配置
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  // 使用 winston 作为全局日志，供过滤器等注入使用
  app.useLogger(app.get<LoggerService>(WINSTON_MODULE_NEST_PROVIDER));

  // 注册全局异常过滤器：统一错误响应并记录日志
  app.useGlobalFilters(new HttpExceptionFilter(app.get(HttpAdapterHost)));
  // 跨域：CORS_ORIGIN 支持逗号分隔多源，* 表示全部（映射为 true 回显请求来源）
  const configService = app.get(ConfigService);
  const corsOrigin = configService.getOrThrow<string>("CORS_ORIGIN");
  const corsOrigins =
    corsOrigin === "*" ? true : corsOrigin.split(",").map((origin) => origin.trim());
  app.enableCors({ origin: corsOrigins });
  // 所有接口统一挂在 /api 前缀下
  app.setGlobalPrefix("api");
  // 接口版本化：URI 方式，缺省版本为 v1
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
  // 启动服务
  await app.listen(configService.getOrThrow<number>("PORT"));
}
void bootstrap();
