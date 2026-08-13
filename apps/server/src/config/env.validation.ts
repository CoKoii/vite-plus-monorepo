import joi from "joi";

// 对 env 变量进行验证
export const envValidationSchema = joi.object({
  // 运行环境支持[development, production, test]，缺省为 development
  NODE_ENV: joi.string().valid("development", "production", "test").default("development"),

  // 应用运行端口，缺省为 3000
  PORT: joi.number().default(3000),

  // 日志级别：debug | info | warn | error，缺省为 info
  LOG_LEVEL: joi.string().valid("debug", "info", "warn", "error").default("info"),

  // 日志文件目录，缺省为 logs
  LOG_DIR: joi.string().default("logs"),

  // 日志文件最大尺寸，超过自动滚动，缺省为 100m
  LOG_MAX_SIZE: joi.string().default("100m"),

  // 日志文件最大保留时间，缺省为 30d
  LOG_MAX_FILES: joi.string().default("30d"),
});
