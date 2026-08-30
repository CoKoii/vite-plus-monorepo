import { randomBytes, createHash } from "node:crypto";

import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Cache } from "cache-manager";

import { parseDuration } from "../../../common/utils/time.util";
import { TokenInvalidException } from "../../../common/errors/business.exception";
import type { User } from "../users/entities/user.entity";

export interface JwtPayload {
  sub: number;
  email: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface RefreshTokenRecord {
  userId: number;
}

@Injectable()
export class TokenService {
  private readonly accessExpiresSec: number;
  private readonly refreshExpiresSec: number;

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessExpiresSec = parseDuration(this.configService.getOrThrow("JWT_ACCESS_EXPIRES"));
    this.refreshExpiresSec = parseDuration(this.configService.getOrThrow("JWT_REFRESH_EXPIRES"));
  }

  /** 生成 access token 和 refresh token 对 */
  async generateTokenPair(user: User): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user),
    ]);
    return { accessToken, refreshToken };
  }

  /** 签发 JWT access token */
  private async generateAccessToken(user: User): Promise<string> {
    return this.jwtService.signAsync(
      { sub: user.id, email: user.email } satisfies JwtPayload,
      { expiresIn: this.accessExpiresSec },
    );
  }

  /** 生成随机 refresh token，SHA256 哈希后存入 Redis */
  private async generateRefreshToken(user: User): Promise<string> {
    const raw = randomBytes(48).toString("base64url");
    const hash = this.hashToken(raw);
    await this.cache.set(
      `rt:${hash}`,
      JSON.stringify({ userId: user.id } satisfies RefreshTokenRecord),
      this.refreshExpiresSec * 1000,
    );
    return raw;
  }

  /** 校验 refresh token 并返回用户 ID */
  async resolveRefreshToken(raw: string): Promise<number> {
    const cached = await this.cache.get<string>(`rt:${this.hashToken(raw)}`);
    if (!cached) throw new TokenInvalidException();
    return (JSON.parse(cached) as RefreshTokenRecord).userId;
  }

  /** 轮换 refresh token：旧 token 失效，生成新 token 对 */
  async rotateRefreshToken(oldRaw: string, user: User): Promise<TokenPair> {
    await this.cache.del(`rt:${this.hashToken(oldRaw)}`);
    return this.generateTokenPair(user);
  }

  /** 删除 refresh token */
  async revokeRefreshToken(raw: string): Promise<void> {
    await this.cache.del(`rt:${this.hashToken(raw)}`);
  }

  /** SHA256 哈希，避免明文存 Redis */
  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
