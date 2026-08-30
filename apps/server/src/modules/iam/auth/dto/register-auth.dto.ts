import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

/** 注册请求 */
export class RegisterAuthDto {
  @IsEmail({}, { message: "邮箱格式不正确" })
  email!: string;

  @IsString()
  @MinLength(8, { message: "密码长度不能少于 8 位" })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: "验证码不能为空" })
  captcha!: string;
}
