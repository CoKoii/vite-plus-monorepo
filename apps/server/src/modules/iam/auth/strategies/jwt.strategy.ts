import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import {
  AccountDisabledException,
  TokenInvalidException,
} from "../../../../common/errors/business.exception";
import type { User } from "../../users/entities/user.entity";
import { UsersService } from "../../users/users.service";
import type { JwtPayload } from "../token.service";

/** 解码 JWT 并查库验证用户有效性 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow("JWT_SECRET"),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findById(payload.sub);
    if (!user) throw new TokenInvalidException();
    if (user.status !== 1) throw new AccountDisabledException();
    if (payload.tokenVersion !== user.tokenVersion) throw new TokenInvalidException();
    return user;
  }
}
