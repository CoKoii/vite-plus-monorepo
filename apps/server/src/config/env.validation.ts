import joi from "joi";

export const envValidationSchema = joi.object({
  // 应用
  NODE_ENV: joi.string().valid("development", "production", "test").default("development"),
  PORT: joi.number().default(3000),
  LOG_LEVEL: joi.string().valid("debug", "info", "warn", "error").default("info"),
  CORS_ORIGIN: joi.when("NODE_ENV", {
    is: "production",
    then: joi.string().trim().min(1).required(),
    otherwise: joi.string().trim().default("*"),
  }),

  // 数据库
  DB_HOST: joi.string().required(),
  DB_PORT: joi.number().port().required(),
  DB_USERNAME: joi.string().required(),
  DB_PASSWORD: joi.string().required(),
  DB_DATABASE: joi.string().required(),
  DB_POOL_MAX: joi.number().integer().min(1).required(),

  // Redis
  REDIS_HOST: joi.string().default("localhost"),
  REDIS_PORT: joi.number().default(6379),
  REDIS_PASSWORD: joi.string().required(),
  REDIS_DB: joi.number().integer().min(0).default(0),

  // 邮件 SMTP
  SMTP_HOST: joi.string().required(),
  SMTP_PORT: joi.number().port().required(),
  SMTP_USER: joi.string().required(),
  SMTP_PASSWORD: joi.string().required(),
  SMTP_FROM: joi.string().required(),

  // 前端地址
  LOGIN_URL: joi.string().uri().required(),

  // JWT
  JWT_SECRET: joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES: joi.string().default("15m"),
  JWT_REFRESH_EXPIRES: joi.string().default("7d"),
});
