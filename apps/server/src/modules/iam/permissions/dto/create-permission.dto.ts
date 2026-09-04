import { IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z][a-z0-9]*(?::[a-z][a-z0-9]*)+$/)
  @MaxLength(100)
  code!: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  description?: string;

  @IsIn([0, 1])
  @IsOptional()
  status?: number;
}
