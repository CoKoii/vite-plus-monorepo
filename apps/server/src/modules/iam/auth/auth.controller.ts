import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";

import { AuthService } from "./auth.service";
import { RegisterAuthDto } from "./dto/register-auth.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /* 生成验证码 */
  @Post("captcha")
  generateCaptcha() {
    return this.authService.generateCaptcha();
  }

  /* 用户注册 */
  @Post("register")
  register(@Body() registerAuthDto: RegisterAuthDto) {
    return this.authService.register(registerAuthDto);
  }

  @Get()
  findAll() {
    return this.authService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.authService.findOne(+id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.authService.remove(+id);
  }
}
