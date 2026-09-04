import { IsEmail, IsOptional, IsString, Length, MaxLength, MinLength } from "class-validator";

export class RegisterAuthDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(32)
  password!: string;

  @IsOptional()
  @IsString()
  @Length(6, 6)
  captcha?: string;
}
