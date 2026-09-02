import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterAuthDto {
  @IsEmail()
  username!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(32)
  password!: string;

  @IsOptional()
  @IsString()
  captcha?: string;
}
