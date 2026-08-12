import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import joi from "joi";

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
  ],
  controllers: [],
})
export class AppModule {}
