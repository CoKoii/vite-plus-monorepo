import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import { ErrorCode } from "../../../common/errors/errorCode";
import { RegisterAuthDto } from "./dto/register-auth.dto";

@Injectable()
export class AuthService {
  generateCaptcha() {
    // TODO: 实现验证码生成逻辑
    throw new HttpException(
      { code: ErrorCode.AUTH_EMAIL_INVALID, message: "邮箱格式不正确" },
      HttpStatus.BAD_REQUEST,
    );
  }

  register(registerAuthDto: RegisterAuthDto) {
    console.log(registerAuthDto);
    // 示例：检查邮箱是否已注册
    // const existing = await this.userRepository.findOneBy({ email: registerAuthDto.email });
    // if (existing) {
    //   throw new HttpException(
    //     { code: ErrorCode.AUTH_EMAIL_ALREADY_EXISTS, message: "邮箱已被注册" },
    //     HttpStatus.CONFLICT,
    //   );
    // }

    throw new HttpException(
      { code: ErrorCode.AUTH_EMAIL_INVALID, message: "邮箱格式不正确" },
      HttpStatus.BAD_REQUEST,
    );
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
