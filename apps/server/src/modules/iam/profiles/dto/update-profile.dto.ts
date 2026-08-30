import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateProfileDto {
  @IsString()
  @MaxLength(50)
  @IsOptional()
  nickname?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  avatar?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  bio?: string;
}
