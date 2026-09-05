import { Injectable, Logger, type OnApplicationShutdown } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AuditLog } from "./entities/audit-log.entity";

export class AuditLogParams {
  userId?: number;
  action!: string;
  resource!: string;
  resourceId?: number;
  ip?: string;
  detail?: Record<string, unknown>;
}

const MAX_BUFFER_SIZE = 10_000;

/** 审计日志服务，内存队列批量写入，不阻塞主请求 */
@Injectable()
export class AuditService implements OnApplicationShutdown {
  private readonly logger = new Logger(AuditService.name);
  private readonly flushTimer: NodeJS.Timeout;
  private buffer: AuditLogParams[] = [];
  private flushing = false;

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {
    this.flushTimer = setInterval(() => void this.flush(), 3000);
    this.flushTimer.unref();
  }

  async onApplicationShutdown() {
    clearInterval(this.flushTimer);
    await this.flush();
  }

  /** 写入审计日志，缓冲区满时丢弃最早的数据保护内存 */
  log(params: AuditLogParams) {
    if (this.buffer.length >= MAX_BUFFER_SIZE) {
      this.buffer.shift();
    }
    this.buffer.push(params);
    if (this.buffer.length >= 50) {
      void this.flush();
    }
  }

  private async flush() {
    if (this.flushing || this.buffer.length === 0) return;
    this.flushing = true;

    const batch = this.buffer.splice(0);
    try {
      await this.auditRepository.save(batch.map((p) => this.auditRepository.create(p)));
    } catch (e) {
      this.logger.warn(`审计日志批量写入失败，${batch.length} 条待重试`, e);
      this.buffer = [...batch, ...this.buffer].slice(-MAX_BUFFER_SIZE);
    } finally {
      this.flushing = false;
    }
  }
}
