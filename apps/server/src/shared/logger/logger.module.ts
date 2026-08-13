import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { utilities, WinstonModule } from "nest-winston";
import { format, transports } from "winston";
import "winston-daily-rotate-file";

// 全局日志模块：控制台输出 LOG_LEVEL 及以上，文件按天轮转记录 warn 及以上
@Module({
  imports: [
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transports: [
          new transports.Console({
            level: configService.getOrThrow<string>("LOG_LEVEL"),
            format: format.combine(format.timestamp(), utilities.format.nestLike("server")),
          }),
          new transports.DailyRotateFile({
            level: "warn",
            dirname: "logs",
            filename: "application-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            maxSize: configService.getOrThrow<string>("LOG_MAX_SIZE"),
            maxFiles: configService.getOrThrow<string>("LOG_MAX_FILES"),
          }),
        ],
      }),
    }),
  ],
})
export class LoggerModule {}
