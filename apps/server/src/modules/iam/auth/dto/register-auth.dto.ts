import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterAuthDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(32)
  password!: string;

  @IsString()
  captcha!: string;
}
