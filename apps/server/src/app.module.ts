import { Global, Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import * as joi from "joi";

import { UserModule } from "./user/user.module.js";

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
    UserModule,
  ],
  controllers: [],
  providers: [Logger],
  exports: [Logger],
})
export class AppModule {}
