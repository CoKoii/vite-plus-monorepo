import { IsEmail } from "class-validator";

/** 发送验证码请求 */
export class GenerateCaptchaDto {
  @IsEmail({}, { message: "邮箱格式不正确" })
  email!: string;
}
