import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class UpdateRoleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  level?: number;

  @IsIn([0, 1])
  @IsOptional()
  status?: number;

  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @IsOptional()
  permissionIds?: number[];
}
