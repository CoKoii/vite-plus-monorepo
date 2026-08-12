import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import joi from "joi";

import { UserModule } from "./user/user.module.ts";

const envFilePath = [`.env.${process.env["NODE_ENV"] || "development"}`, ".env"];
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
})
export class AppModule {}
