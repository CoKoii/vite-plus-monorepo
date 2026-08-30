import { IsNotEmpty, IsString } from "class-validator";

/** 刷新 token 请求 */
export class RefreshAuthDto {
  @IsString()
  @IsNotEmpty({ message: "refreshToken 不能为空" })
  refreshToken!: string;
}
