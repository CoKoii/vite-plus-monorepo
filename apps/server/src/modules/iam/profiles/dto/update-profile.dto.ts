import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateProfileDto {
  @IsString()
  @MaxLength(50)
  @IsOptional()
  nickname?: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  avatar?: string;
}
