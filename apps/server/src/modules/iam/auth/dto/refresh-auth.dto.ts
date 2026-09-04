import { IsString, MaxLength } from "class-validator";

export class RefreshAuthDto {
  @IsString()
  @MaxLength(512)
  refreshToken!: string;
}
