import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { utilities } from "nest-winston";
import { WinstonModule } from "nest-winston";
import { createLogger } from "winston";
import * as winston from "winston";

import { AppModule } from "./app.module.js";

async function bootstrap() {
  const instance = createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(winston.format.timestamp(), utilities.format.nestLike()),
      }),
    ],
  });
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    logger: WinstonModule.createLogger({ instance }),
  });
  await app.listen(3000);
}
void bootstrap();
