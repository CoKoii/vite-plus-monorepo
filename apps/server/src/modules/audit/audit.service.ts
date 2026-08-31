import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AuditLog } from "./entities/audit-log.entity";

export class AuditLogParams {
  userId?: number;
  action!: string;
  resource!: string;
  resourceId?: number;
  ip?: string;
  detail?: Record<string, any>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private buffer: AuditLogParams[] = [];
  private flushing = false;

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {
    // 每 3 秒批量写入一次
    setInterval(() => this.flush(), 3000);
  }

  /** 写入审计日志（同步入队，异步批量写入 DB） */
  log(params: AuditLogParams) {
    this.buffer.push(params);
    if (this.buffer.length >= 50) {
      this.flush();
    }
  }

  private async flush() {
    if (this.flushing || this.buffer.length === 0) return;
    this.flushing = true;

    const batch = this.buffer.splice(0);
    try {
      await this.auditRepository.save(
        batch.map((p) => this.auditRepository.create(p)),
      );
    } catch (e) {
      this.logger.warn(`审计日志批量写入失败，${batch.length} 条待重试`, e);
      // 写入失败放回队列头部，下次 flush 重试
      this.buffer.unshift(...batch);
    } finally {
      this.flushing = false;
    }
  }
}
