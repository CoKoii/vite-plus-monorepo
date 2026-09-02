import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class LoginAuthDto {
  @IsEmail()
  username!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(32)
  password!: string;
}
