import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class RegisterAuthDto {
  @IsEmail({}, { message: "邮箱格式不正确" })
  email!: string;

  @MinLength(8, { message: "密码长度不能少于 8 位" })
  password!: string;

  @IsNotEmpty({ message: "验证码不能为空" })
  captcha!: string;
}
