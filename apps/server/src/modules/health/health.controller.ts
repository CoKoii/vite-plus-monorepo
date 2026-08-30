import { Controller, Get, HttpException, HttpStatus } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import type { Cache } from "cache-manager";

import { Public } from "../iam/auth/decorators/public.decorator";

@Controller("health")
export class HealthController {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Public() @Get()
  async check() {
    const [db, redis] = await Promise.all([
      this.dataSource.query("SELECT 1").then(() => true, () => false),
      this.cache.set("health:ping", "pong", 10000).then(() => true, () => false),
    ]);
    if (redis) await this.cache.del("health:ping");

    const ok = db && redis;
    if (!ok) throw new HttpException({ status: "degraded", db, redis }, HttpStatus.SERVICE_UNAVAILABLE);
    return { status: "ok", db, redis, timestamp: new Date().toISOString() };
  }
}
