import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdatePermissionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  description?: string;

  @IsIn([0, 1])
  @IsOptional()
  status?: number;
}
