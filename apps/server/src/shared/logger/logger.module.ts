import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { utilities, WinstonModule } from "nest-winston";
import { format, transports } from "winston";

@Module({
  imports: [
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transports: [
          new transports.Console({
            level: "info",
            format: format.combine(
              format.timestamp(),
              format.simple(),
              utilities.format.nestLike(),
            ),
          }),
          new transports.DailyRotateFile({
            level: "warn",
            dirname: "logs",
            filename: "application-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            maxSize: configService.get<string>("LOG_MAX_SIZE"),
            maxFiles: configService.get<string>("LOG_MAX_FILES"),
          }),
        ],
      }),
    }),
  ],
})
export class LoggerModule {}
