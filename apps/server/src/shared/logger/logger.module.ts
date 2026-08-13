import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { utilities, WinstonModule } from "nest-winston";
import { format, transports } from "winston";
import "winston-daily-rotate-file";

@Module({
  imports: [
    // 全局日志：winston 控制台 + 滚动文件
    WinstonModule.forRootAsync({
      // 注入 ConfigService 以便读取日志相关配置
      inject: [ConfigService],
      // 创建日志配置
      useFactory: (configService: ConfigService) => {
        // 日志文件格式：JSON + 时间戳
        const fileFormat = format.combine(format.timestamp(), format.json());
        // 创建按天轮转的文件通道
        const createFileTransport = (level: string, filename: string) =>
          new transports.DailyRotateFile({
            level,
            filename,
            dirname: "logs",
            datePattern: "YYYY-MM-DD",
            maxSize: configService.getOrThrow<string>("LOG_MAX_SIZE"),
            maxFiles: configService.getOrThrow<string>("LOG_MAX_FILES"),
            format: fileFormat,
          });
        return {
          transports: [
            // 控制台：按 Nest 风格输出，便于开发调试
            new transports.Console({
              level: configService.getOrThrow<string>("LOG_LEVEL"),
              format: format.combine(
                format.timestamp(),
                format.ms(),
                utilities.format.nestLike("server"),
              ),
            }),
            // 日志文件：按级别分文件存储，便于运维分析
            createFileTransport("warn", "application-%DATE%.log"),
            createFileTransport("error", "error-%DATE%.log"),
          ],
        };
      },
    }),
  ],
})
export class LoggerModule {}

// logs/
// ├── application/
// │   └── application-%DATE%.log
// │
// ├── access/
// │   └── access-%DATE%.log
// │
// ├── audit/
// │   └── audit-%DATE%.log
// │
// └── error/
//     └── error-%DATE%.log
// TODO 建议后续把日志文件按功能模块化存储，便于运维分析
