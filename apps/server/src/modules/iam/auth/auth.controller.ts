/** 认证接口：验证码、注册、登录、刷新、退出 */
import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import type { User } from "../users/entities/user.entity";
import { AuthService } from "./auth.service";
import { CurrentUser } from "./decorators/current-user.decorator";
import { Public } from "./decorators/public.decorator";
import { ChangePasswordAuthDto } from "./dto/change-password-auth.dto";
import { ForgotPasswordAuthDto } from "./dto/forgot-password-auth.dto";
import { GenerateCaptchaDto } from "./dto/generate-captcha.dto";
import { LoginAuthDto } from "./dto/login-auth.dto";
import { RefreshAuthDto } from "./dto/refresh-auth.dto";
import { RegisterAuthDto } from "./dto/register-auth.dto";
import { ResetPasswordAuthDto } from "./dto/reset-password-auth.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("captcha")
  generateCaptcha(@Body() dto: GenerateCaptchaDto) {
    return this.authService.generateCaptcha(dto);
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Public()
  @Post("register")
  register(@Body() dto: RegisterAuthDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("login")
  login(@Body() dto: LoginAuthDto) {
    return this.authService.login(dto.email, dto.password, dto.deviceId);
  }

  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Post("password/change/code")
  @HttpCode(HttpStatus.OK)
  requestChangePasswordCode(@CurrentUser() user: User) {
    return this.authService.requestChangePasswordCode(user.id);
  }

  @Post("password/change")
  @HttpCode(HttpStatus.OK)
  changePassword(@CurrentUser() user: User, @Body() dto: ChangePasswordAuthDto) {
    return this.authService.changePassword(user.id, dto);
  }

  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Public()
  @Post("password/forgot")
  @HttpCode(HttpStatus.OK)
  requestPasswordReset(@Body() dto: ForgotPasswordAuthDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Public()
  @Post("password/reset")
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordAuthDto) {
    return this.authService.resetPassword(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("refresh")
  refresh(@Body() dto: RefreshAuthDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @HttpCode(HttpStatus.OK)
  @Post("logout")
  logout(@Body() dto: RefreshAuthDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @HttpCode(HttpStatus.OK)
  @Post("logout-all")
  logoutAll(@CurrentUser() user: User) {
    return this.authService.logoutAll(user.id);
  }
}
