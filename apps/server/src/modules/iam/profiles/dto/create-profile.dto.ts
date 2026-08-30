import { IsOptional, IsString, MaxLength } from "class-validator";

export class CreateProfileDto {
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
