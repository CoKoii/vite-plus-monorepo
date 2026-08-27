import { IsEmail, IsNotEmpty, MinLength } from "class-validator";
export class CreateUserDto {
  @IsNotEmpty({ message: "邮箱不能为空" })
  @IsEmail({}, { message: "邮箱格式不正确" })
  email!: string;

  @IsNotEmpty({ message: "密码不能为空" })
  @MinLength(8, { message: "密码长度不能少于 8 位" })
  password!: string;
}
