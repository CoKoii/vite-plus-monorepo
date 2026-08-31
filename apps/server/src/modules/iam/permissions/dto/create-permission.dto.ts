import { IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreatePermissionDto {
  @IsString()
  @MaxLength(50)
  name!: string;

  @IsString()
  @MaxLength(100)
  code!: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  status?: number;
}
