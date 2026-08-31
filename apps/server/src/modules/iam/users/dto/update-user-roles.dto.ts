import { ArrayUnique, IsArray, IsInt } from "class-validator";

export class UpdateUserRolesDto {
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  roleIds!: number[];
}
