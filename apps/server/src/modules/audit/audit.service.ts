import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AuditLog } from "./entities/audit-log.entity";

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  log(params: { userId?: number; action: string; resource: string; resourceId?: number; ip?: string; detail?: Record<string, any> }) {
    return this.auditRepository.save(this.auditRepository.create(params));
  }
}
