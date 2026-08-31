import { IsArray, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

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

  @IsInt()
  @Min(0)
  @IsOptional()
  status?: number;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  permissionIds?: number[];
}
