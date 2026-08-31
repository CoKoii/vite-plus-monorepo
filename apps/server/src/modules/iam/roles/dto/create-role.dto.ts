import { IsArray, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateRoleDto {
  @IsString()
  @MaxLength(50)
  name!: string;

  @IsString()
  @MaxLength(50)
  code!: string;

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
