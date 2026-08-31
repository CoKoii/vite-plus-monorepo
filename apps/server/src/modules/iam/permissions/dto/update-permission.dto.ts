import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdatePermissionDto {
  @IsString()
  @MaxLength(50)
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  code?: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  description?: string;
}
