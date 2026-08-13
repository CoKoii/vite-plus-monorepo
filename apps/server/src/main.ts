import type { LoggerService } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import "reflect-metadata";

import { AppModule } from "./app.module.ts";
import { HttpExceptionFilter } from "./common/filters/all-exception.filter.ts";

// 应用启动入口：注册全局中间件并监听端口
async function bootstrap() {
  // 基于 Fastify 创建应用，日志由 LoggerModule 统一配置
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  // 使用 winston 作为全局日志，供过滤器等注入使用
  const logger = app.get<LoggerService>(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);
  // 所有接口统一挂在 /api 前缀下
  app.setGlobalPrefix("api");
  // 注册全局异常过滤器：统一错误响应并记录日志
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new HttpExceptionFilter(logger, httpAdapter));
  // 从配置读取端口并启动服务
  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>("PORT");
  await app.listen(port);
}
void bootstrap();
