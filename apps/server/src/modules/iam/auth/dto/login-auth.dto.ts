import { IsEmail, IsString, MinLength } from "class-validator";

/** 登录请求 */
export class LoginAuthDto {
  @IsEmail({}, { message: "邮箱格式不正确" })
  email!: string;

  @IsString()
  @MinLength(8, { message: "密码长度不能少于 8 位" })
  password!: string;
}
