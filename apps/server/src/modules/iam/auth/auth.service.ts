import { Injectable } from "@nestjs/common";

import { RegisterAuthDto } from "./dto/register-auth.dto";
import { UpdateAuthDto } from "./dto/update-auth.dto";

@Injectable()
export class AuthService {
  generateCaptcha() {
    return "Captcha generated";
  }
  register(registerAuthDto: RegisterAuthDto) {
    return `Registration attempted for email: ${registerAuthDto.email}`;
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
