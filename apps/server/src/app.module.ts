import { Global, Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import * as joi from "joi";

import { AppController } from "./app.controller.js";

const envFilePath = [`.env.${process.env["NODE_ENV"] || "development"}`, ".env"];
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath,
      validationSchema: joi.object({
        NODE_ENV: joi.string().valid("development", "production").default("development"),
      }),
    }),
  ],
  controllers: [AppController],
  providers: [Logger],
  exports: [Logger],
})
export class AppModule {}
