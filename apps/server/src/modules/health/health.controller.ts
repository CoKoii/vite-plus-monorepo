import { Controller, Get } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";

import { Public } from "../iam/auth/decorators/public.decorator";
import { HealthService } from "./health.service";

/** 健康检查接口，跳过限流，用于监控轮询 */
@SkipThrottle()
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  check() {
    return this.healthService.check();
  }
}
