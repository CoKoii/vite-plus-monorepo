import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { utilities, WinstonModule } from "nest-winston";
import { format, transports } from "winston";
import "winston-daily-rotate-file";

// 全局日志模块：
// - 控制台：人类可读的 Nest 风格，输出 LOG_LEVEL 及以上
// - 文件：JSON 结构化、按天轮转；error 单独落盘便于告警和定位
@Module({
  imports: [
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // 文件统一用 JSON 结构化格式，便于日志采集系统解析
        const fileFormat = format.combine(format.timestamp(), format.json());
        // 创建按天轮转的文件通道
        const createFileTransport = (level: string, filename: string) =>
          new transports.DailyRotateFile({
            level,
            filename,
            dirname: configService.getOrThrow<string>("LOG_DIR"),
            datePattern: "YYYY-MM-DD",
            maxSize: configService.getOrThrow<string>("LOG_MAX_SIZE"),
            maxFiles: configService.getOrThrow<string>("LOG_MAX_FILES"),
            format: fileFormat,
          });
        return {
          transports: [
            // 控制台：人类可读，开发排查友好
            new transports.Console({
              level: configService.getOrThrow<string>("LOG_LEVEL"),
              format: format.combine(format.timestamp(), utilities.format.nestLike("server")),
            }),
            // 全量文件：warn 及以上，常规排查
            createFileTransport("warn", "application-%DATE%.log"),
            // 错误文件：仅 error，单独采集用于告警
            createFileTransport("error", "error-%DATE%.log"),
          ],
        };
      },
    }),
  ],
})
export class LoggerModule {}
