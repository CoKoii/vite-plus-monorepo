import { ConfigService } from "@nestjs/config";
import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import { utilities, WinstonModule } from "nest-winston";
import "reflect-metadata";
import { createLogger, format, transports } from "winston";
import "winston-daily-rotate-file";

import { AppModule } from "./app.module.ts";
import { HttpExceptionFilter } from "./common/filters/all-exception.filter.ts";

// 应用启动入口：组装日志、注册全局中间件并监听端口
async function bootstrap() {
  // 日志：控制台输出 info 及以上；文件按天轮转，warn 及以上保留 14 天
  const logger = WinstonModule.createLogger(
    createLogger({
      transports: [
        new transports.Console({
          level: "info",
          format: format.combine(format.timestamp(), utilities.format.nestLike()),
        }),
        new transports.DailyRotateFile({
          level: "warn",
          dirname: "logs",
          filename: "application-%DATE%.log",
          datePattern: "YYYY-MM-DD-HH",
          maxFiles: "14d",
        }),
      ],
    }),
  );
  // 基于 Fastify 创建应用，统一注入自定义日志
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    logger,
  });
  // 所有接口统一挂在 /api 前缀下
  app.setGlobalPrefix("api");
  // 注册全局异常过滤器：统一错误响应并记录日志
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new HttpExceptionFilter(logger, httpAdapter));
  // 从配置读取端口并启动服务
  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT")!;
  await app.listen(port);
}
void bootstrap();
