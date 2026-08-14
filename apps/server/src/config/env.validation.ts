import joi from "joi";

// 对 env 变量进行验证
export const envValidationSchema = joi.object({
  // 运行环境支持[development, production, test]，缺省为 development
  NODE_ENV: joi.string().valid("development", "production", "test").default("development"),

  // 应用运行端口，缺省为 3000
  PORT: joi.number().default(3000),

  // 日志级别：debug | info | warn | error，缺省为 info
  LOG_LEVEL: joi.string().valid("debug", "info", "warn", "error").default("info"),

  // 跨域：开发/测试默认允许全部来源，生产环境必须显式配置。
  CORS_ORIGIN: joi.when("NODE_ENV", {
    is: "production",
    // oxlint-disable-next-line no-thenable
    then: joi.string().trim().min(1).required(),
    otherwise: joi.string().trim().default("*"),
  }),
});
