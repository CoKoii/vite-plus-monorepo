import joi from "joi";

// 对 env 变量进行验证
export const envValidationSchema = joi.object({
  // 运行环境支持[development, production, test]，缺省为 development
  NODE_ENV: joi.string().valid("development", "production", "test").default("development"),

  // 应用运行端口，缺省为 3000
  PORT: joi.number().default(3000),

  // 日志级别：debug | info | warn | error，缺省为 info
  LOG_LEVEL: joi.string().valid("debug", "info", "warn", "error").default("info"),

  // 跨域请求的来源，缺省为 *，表示允许所有来源
  CORS_ORIGIN: joi.when("NODE_ENV", {
    is: "production",
    // oxlint-disable-next-line no-thenable
    then: joi.string().trim().min(1).required(),
    otherwise: joi.string().trim().default("*"),
  }),

  // Redis 主机地址，缺省为 localhost
  REDIS_HOST: joi.string().default("localhost"),

  // Redis 端口，缺省为 6379
  REDIS_PORT: joi.number().default(6379),

  // Redis 密码
  REDIS_PASSWORD: joi.string().required(),

  // Redis 数据库编号，缺省为 0
  REDIS_DB: joi.number().integer().min(0).default(0),

  // 邮件 SMTP 配置（QQ 邮箱，SMTP_PASSWORD 使用授权码）
  SMTP_HOST: joi.string().required(),
  SMTP_PORT: joi.number().port().required(),
  SMTP_USER: joi.string().required(),
  SMTP_PASSWORD: joi.string().required(),
});
