import { IsEmail, IsString, Length, Matches, MaxLength, MinLength } from "class-validator";

export class ResetPasswordAuthDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(32)
  newPassword!: string;
}
