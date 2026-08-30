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

  @Public() @Post("captcha")
  generateCaptcha(@Body() dto: GenerateCaptchaDto) {
    return this.authService.generateCaptcha(dto);
  }

  @Public() @Post("register")
  register(@Body() dto: RegisterAuthDto) {
    return this.authService.register(dto);
  }

  @Public() @Post("login")
  login(@Body() dto: LoginAuthDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Public() @Post("refresh")
  refresh(@Body() dto: RefreshAuthDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post("logout")
  logout(@Body() dto: RefreshAuthDto) {
    return this.authService.logout(dto.refreshToken);
  }
}
