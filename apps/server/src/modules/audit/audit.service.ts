import { Injectable } from "@nestjs/common";
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
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async log(params: AuditLogParams) {
    await this.auditRepository.save(this.auditRepository.create(params));
  }
}
