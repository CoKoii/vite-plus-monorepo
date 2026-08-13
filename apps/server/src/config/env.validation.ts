import joi from "joi";

// 对 env 变量进行验证
export const envValidationSchema = joi.object({
  // 运行环境支持[development, production, test]，缺省为 development
  NODE_ENV: joi.string().valid("development", "production", "test").default("development"),

  // 应用运行端口，缺省为 3000
  PORT: joi.number().default(3000),

  /*
   * 日志配置
   *
   * LOG_MAX_SIZE：日志文件最大尺寸，默认为 100m
   * LOG_MAX_FILES：日志文件最大保留时间，默认为 30d
   */
  LOG_MAX_SIZE: joi.string().default("100m"),
  LOG_MAX_FILES: joi.string().default("30d"),
});
