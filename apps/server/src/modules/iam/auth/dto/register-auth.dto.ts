import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class RegisterAuthDto {
  @IsEmail({}, { message: "邮箱格式不正确" })
  email!: string;

  @IsString({ message: "密码必须是字符串" })
  @MinLength(8, { message: "密码长度不能少于 8 位" })
  password!: string;

  @IsString({ message: "验证码必须是字符串" })
  @IsNotEmpty({ message: "验证码不能为空" })
  captcha!: string;
}
