import { createKeyv } from "@keyv/redis";
import { CacheModule as NestCacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

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

  exports: [NestCacheModule],
})
export class CacheModule {}
