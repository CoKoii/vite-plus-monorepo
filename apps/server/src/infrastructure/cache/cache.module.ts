import { createKeyv } from "@keyv/redis";
import { CACHE_MANAGER, CacheModule as NestCacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Cache } from "cache-manager";

export const REDIS_CLIENT = Symbol("REDIS_CLIENT");

export interface RedisClient {
  mGet(keys: string[]): Promise<(string | null)[]>;
  incr(key: string): Promise<number>;
}

@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.getOrThrow<string>("REDIS_HOST");
        const port = configService.getOrThrow<number>("REDIS_PORT");
        const password = configService.getOrThrow<string>("REDIS_PASSWORD");
        const database = configService.getOrThrow<number>("REDIS_DB");

        const redisUrl =
          `redis://:${encodeURIComponent(password)}` + `@${host}:${port}/${database}`;
        return {
          stores: [createKeyv(redisUrl)],
        };
      },
    }),
  ],

  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [CACHE_MANAGER],
      useFactory: (cache: Cache) => {
        const client = cache.stores[0]?.store?.client;
        if (!client) throw new Error("Redis client is unavailable");
        return client;
      },
    },
  ],

  exports: [NestCacheModule, REDIS_CLIENT],
})
export class CacheModule {}
