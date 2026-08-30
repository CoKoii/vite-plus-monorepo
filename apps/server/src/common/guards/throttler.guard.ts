import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable, SetMetadata, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Cache } from "cache-manager";

export const THROTTLE_LIMIT = "throttle:limit";
export const THROTTLE_TTL = "throttle:ttl";

/** 限流装饰器：@Throttle(10, 60) 表示 60 秒内最多 10 次请求 */
export const Throttle = (limit: number, ttl: number) =>
  (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    SetMetadata(THROTTLE_LIMIT, limit)(target, key!, descriptor!);
    SetMetadata(THROTTLE_TTL, ttl)(target, key!, descriptor!);
  };

@Injectable()
export class ThrottlerGuard {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const limit = this.reflector.get<number>(THROTTLE_LIMIT, context.getHandler()) ?? 60;
    const ttl = this.reflector.get<number>(THROTTLE_TTL, context.getHandler()) ?? 60;

    const req = context.switchToHttp().getRequest<{ ip: string; url: string }>();
    const key = `ratelimit:${req.ip}:${req.url}`;

    const count = await this.cache.get<number>(key);
    if (count && count >= limit) return false;

    await this.cache.set(key, (count ?? 0) + 1, ttl * 1000);
    return true;
  }
}
