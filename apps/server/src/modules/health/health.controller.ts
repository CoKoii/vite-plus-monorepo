import { Controller, Get } from "@nestjs/common";
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

  @Public()
  @Get()
  async check() {
    const db = await this.dataSource.query("SELECT 1 AS ok").then(() => true, () => false);
    const redis = await this.cache.set("health:ping", "pong", 10000).then(() => true, () => false);
    await this.cache.del("health:ping");

    return { status: db && redis ? "ok" : "degraded", db, redis, timestamp: new Date().toISOString() };
  }
}
