import { randomUUID } from "node:crypto";

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
import { setupSwagger } from "./common/swagger";

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

  app.useLogger(app.get<LoggerService>(WINSTON_MODULE_NEST_PROVIDER));

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  app.useGlobalFilters(
    new UnknownExceptionFilter(httpAdapterHost),
    new HttpExceptionFilter(httpAdapterHost),
    new BusinessExceptionFilter(httpAdapterHost),
  );

  app.useGlobalInterceptors(new ResponseInterceptor());

  if (configService.get("NODE_ENV") !== "production") {
    setupSwagger(app);
  }

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
