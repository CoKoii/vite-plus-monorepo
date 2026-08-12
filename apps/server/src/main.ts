import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import { utilities, WinstonModule } from "nest-winston";
import "reflect-metadata";
import { createLogger, format, transports } from "winston";
import "winston-daily-rotate-file";

import { AppModule } from "./app.module.ts";
import { HttpExceptionFilter } from "./common/filters/all-exception.filter.ts";

async function bootstrap() {
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
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    logger,
  });
  app.setGlobalPrefix("api");
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new HttpExceptionFilter(logger, httpAdapter));
  await app.listen(3000);
}
void bootstrap();
