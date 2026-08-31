import { IsArray, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateRoleDto {
  @IsString()
  @MaxLength(50)
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  code?: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  permissionIds?: number[];
}
