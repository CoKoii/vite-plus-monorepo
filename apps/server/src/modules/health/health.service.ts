import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import type { Cache } from "cache-manager";
import { DataSource } from "typeorm";

import { InfrastructureUnavailableException } from "../../common/errors/business.exception";

/** 健康检查服务，验证 DB 和 Redis 连通性 */
@Injectable()
export class HealthService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async check() {
    const [db, redis] = await Promise.all([
      this.dataSource.query("SELECT 1").then(
        () => true,
        () => false,
      ),
      this.cache.set("health:ping", "pong", 10000).then(
        () => true,
        () => false,
      ),
    ]);
    if (redis) await this.cache.del("health:ping");

    if (!db || !redis) throw new InfrastructureUnavailableException("系统服务异常");
    return "系统服务一切正常";
  }
}
