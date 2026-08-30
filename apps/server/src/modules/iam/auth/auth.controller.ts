import { Body, Controller, Post } from "@nestjs/common";

import { AuthService } from "./auth.service";
import { Public } from "./decorators/public.decorator";
import { GenerateCaptchaDto } from "./dto/generate-captcha.dto";
import { LoginAuthDto } from "./dto/login-auth.dto";
import { RefreshAuthDto } from "./dto/refresh-auth.dto";
import { RegisterAuthDto } from "./dto/register-auth.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** 发送邮箱验证码 */
  @Public() @Post("captcha")
  generateCaptcha(@Body() dto: GenerateCaptchaDto) {
    return this.authService.generateCaptcha(dto);
  }

  /** 注册账号并自动返回 token */
  @Public() @Post("register")
  register(@Body() dto: RegisterAuthDto) {
    return this.authService.register(dto);
  }

  /** 邮箱密码登录 */
  @Public() @Post("login")
  login(@Body() dto: LoginAuthDto) {
    return this.authService.login(dto.email, dto.password);
  }

  /** 刷新 token */
  @Public() @Post("refresh")
  refresh(@Body() dto: RefreshAuthDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  /** 退出登录 */
  @Post("logout")
  logout(@Body() dto: RefreshAuthDto) {
    return this.authService.logout(dto.refreshToken);
  }
}
