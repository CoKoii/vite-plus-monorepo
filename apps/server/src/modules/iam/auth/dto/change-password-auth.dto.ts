import { IsString, Length, Matches, MaxLength, MinLength } from "class-validator";

export class ChangePasswordAuthDto {
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(32)
  newPassword!: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code!: string;
}
