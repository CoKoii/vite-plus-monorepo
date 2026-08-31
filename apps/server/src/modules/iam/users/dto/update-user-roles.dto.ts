import { ArrayNotEmpty, IsArray, IsInt } from "class-validator";

export class UpdateUserRolesDto {
  @IsArray()
  @ArrayNotEmpty({ message: "角色 ID 列表不能为空" })
  @IsInt({ each: true, message: "角色 ID 必须是整数" })
  roleIds!: number[];
}
