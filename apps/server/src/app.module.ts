import { Module } from "@nestjs/common";

import { AppConfigModule } from "./config/config.module.ts";
import { CacheModule } from "./infrastructure/cache/cache.module.ts";
import { LoggerModule } from "./infrastructure/logger/logger.module.ts";

@Module({
  imports: [
    // 全局配置：env 加载 + Joi 校验
    AppConfigModule,

    // 全局日志：winston 控制台 + 滚动文件
    LoggerModule,

    // 全局缓存：Redis
    CacheModule,
  ],
  controllers: [],
})
export class AppModule {}
