import { BadRequestException, Injectable } from "@nestjs/common";

import { ErrorCode } from "../../../common/errors/errorCode";
import { RegisterAuthDto } from "./dto/register-auth.dto";

@Injectable()
export class AuthService {
  generateCaptcha() {
    throw new BadRequestException({
      code: ErrorCode.AUTH_EMAIL_INVALID,
      message: "邮箱格式不正确",
    });
  }
  register(registerAuthDto: RegisterAuthDto) {
    console.log(registerAuthDto);
    throw new BadRequestException({
      code: ErrorCode.AUTH_EMAIL_INVALID,
      message: "邮箱格式不正确",
    });
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
