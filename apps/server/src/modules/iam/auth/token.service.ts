/** Token 管理服务：签发、校验、轮换 access/refresh token */
import { createHash, randomBytes, randomUUID } from "node:crypto";

import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Cache } from "cache-manager";

import {
  InfrastructureUnavailableException,
  TokenInvalidException,
} from "../../../common/errors/business.exception";
import { parseDuration } from "../../../common/utils/time.util";
import { REDIS_CLIENT, type RedisClient } from "../../../infrastructure/cache/cache.module";
import type { User } from "../users/entities/user.entity";

export interface JwtPayload {
  sub: number;
  email: string | null;
  tokenVersion: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface RefreshTokenRecord {
  userId: number;
  sessionId: string;
  tokenVersion: number;
}

const USER_LOCK_TTL_MS = 30_000;
const USER_LOCK_WAIT_MS = 25;
const USER_LOCK_WAIT_LIMIT = 400;
const RELEASE_USER_LOCK_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
end
return 0
`;

@Injectable()
export class TokenService {
  private readonly accessExpiresSec: number;
  private readonly refreshExpiresSec: number;

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: RedisClient,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessExpiresSec = parseDuration(this.configService.getOrThrow("JWT_ACCESS_EXPIRES"));
    this.refreshExpiresSec = parseDuration(this.configService.getOrThrow("JWT_REFRESH_EXPIRES"));
  }

  /** 生成 access token 和 refresh token 对 */
  async generateTokenPair(user: User, sessionId: string = randomUUID()): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user, sessionId),
    ]);
    return { accessToken, refreshToken };
  }

  async withUserLock<T>(userId: number, operation: () => Promise<T>): Promise<T> {
    const key = `auth:lock:user:${userId}`;
    const lockValue = randomUUID();

    for (let attempt = 0; attempt < USER_LOCK_WAIT_LIMIT; attempt += 1) {
      const acquired = await this.redisClient.set(key, lockValue, {
        NX: true,
        PX: USER_LOCK_TTL_MS,
      });
      if (acquired === "OK") {
        try {
          return await operation();
        } finally {
          await this.redisClient.eval(RELEASE_USER_LOCK_SCRIPT, {
            keys: [key],
            arguments: [lockValue],
          });
        }
      }
      await new Promise((resolve) => setTimeout(resolve, USER_LOCK_WAIT_MS));
    }

    throw new InfrastructureUnavailableException("会话操作繁忙，请稍后重试");
  }

  /** 签发 JWT access token */
  private async generateAccessToken(user: User): Promise<string> {
    return this.jwtService.signAsync(
      { sub: user.id, email: user.email, tokenVersion: user.tokenVersion } satisfies JwtPayload,
      {
        expiresIn: this.accessExpiresSec,
      },
    );
  }

  /** 生成随机 refresh token，SHA256 哈希后存入 Redis */
  private async generateRefreshToken(user: User, sessionId: string): Promise<string> {
    const raw = randomBytes(48).toString("base64url");
    const hash = this.hashToken(raw);
    const record = {
      userId: user.id,
      sessionId,
      tokenVersion: user.tokenVersion,
    } satisfies RefreshTokenRecord;
    await this.cache.set(`rt:${hash}`, JSON.stringify(record), this.refreshExpiresSec * 1000);
    await this.cache.set(`auth:session:${sessionId}`, hash, this.refreshExpiresSec * 1000);
    await this.redisClient.sAdd(`auth:sessions:${user.id}`, sessionId);
    return raw;
  }

  /** 校验 refresh token 并返回会话信息 */
  async resolveRefreshToken(raw: string): Promise<RefreshTokenRecord> {
    const cached = await this.cache.get<string>(`rt:${this.hashToken(raw)}`);
    return this.parseRefreshToken(cached ?? null);
  }

  /** 轮换 refresh token：旧 token 失效，生成新 token 对 */
  async rotateRefreshToken(oldRaw: string, user: User, sessionId: string): Promise<TokenPair> {
    const hash = this.hashToken(oldRaw);
    const record = this.parseRefreshToken(
      this.unwrapCacheValue(await this.redisClient.getDel(`rt:${hash}`)),
    );
    if (
      record.userId !== user.id ||
      record.sessionId !== sessionId ||
      record.tokenVersion !== user.tokenVersion
    ) {
      throw new TokenInvalidException();
    }
    await this.cache.del(`auth:session:${sessionId}`);
    return this.generateTokenPair(user, sessionId);
  }

  /** 删除 refresh token */
  async revokeRefreshToken(raw: string): Promise<void> {
    const record = this.parseRefreshTokenOrNull(
      this.unwrapCacheValue(await this.redisClient.getDel(`rt:${this.hashToken(raw)}`)),
    );
    if (!record) return;
    await Promise.all([
      this.cache.del(`auth:session:${record.sessionId}`),
      this.redisClient.sRem(`auth:sessions:${record.userId}`, record.sessionId),
    ]);
  }

  /** 撤销用户的全部设备会话。 */
  async revokeAllSessions(userId: number): Promise<void> {
    const sessionsKey = `auth:sessions:${userId}`;
    const sessionIds = await this.redisClient.sMembers(sessionsKey);
    await this.cache.del(sessionsKey);
    if (!sessionIds.length) return;

    const sessionKeys = sessionIds.map((id) => `auth:session:${id}`);
    const hashes = (await this.redisClient.mGet(sessionKeys)).map((value) =>
      this.unwrapCacheValue(value),
    );
    const keys = [
      ...sessionKeys,
      ...hashes.filter((hash): hash is string => hash !== null).map((hash) => `rt:${hash}`),
    ];
    await Promise.all(keys.map((key) => this.cache.del(key)));
  }

  private parseRefreshToken(cached: string | null): RefreshTokenRecord {
    const record = this.parseRefreshTokenOrNull(cached);
    if (!record) throw new TokenInvalidException();
    return record;
  }

  private parseRefreshTokenOrNull(cached: string | null): RefreshTokenRecord | null {
    if (!cached) return null;
    try {
      const record = JSON.parse(cached) as Partial<RefreshTokenRecord>;
      if (
        typeof record.userId !== "number" ||
        typeof record.sessionId !== "string" ||
        !Number.isInteger(record.tokenVersion)
      )
        return null;
      return record as RefreshTokenRecord;
    } catch {
      return null;
    }
  }

  /** Keyv Redis stores cache values inside a value/expires envelope. */
  private unwrapCacheValue(cached: string | null): string | null {
    if (cached === null) return null;
    try {
      const envelope = JSON.parse(cached) as { value?: unknown };
      if (Object.prototype.hasOwnProperty.call(envelope, "value")) {
        return typeof envelope.value === "string" ? envelope.value : JSON.stringify(envelope.value);
      }
    } catch {
      // Raw Redis values are also accepted for compatibility.
    }
    return cached;
  }

  /** SHA256 哈希，避免明文存 Redis */
  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
