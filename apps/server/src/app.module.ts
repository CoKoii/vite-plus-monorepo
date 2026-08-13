import { Module } from "@nestjs/common";

import { AppConfigModule } from "./config/config.module.ts";
import { LoggerModule } from "./shared/logger/logger.module.ts";

// 根模块：只聚合功能模块，不写业务逻辑
@Module({
  imports: [
    // 全局配置：env 加载 + Joi 校验
    AppConfigModule,
    // 全局日志：winston 控制台 + 滚动文件
    LoggerModule,
  ],
  controllers: [],
})
export class AppModule {}
