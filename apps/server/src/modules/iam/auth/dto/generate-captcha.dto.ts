import { IsEmail } from "class-validator";

export class GenerateCaptchaDto {
  @IsEmail()
  email!: string;
}
