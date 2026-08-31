import {
  Injectable,
  Logger,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";

import { AuditService } from "../../modules/audit/audit.service";

/** 自动审计拦截器，记录所有写操作；审计失败不影响主流程 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context
      .switchToHttp()
      .getRequest<{ method: string; url: string; ip: string; user?: { id: number } }>();

    if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next.handle();

    const start = Date.now();
    const meta = { userId: req.user?.id, action: req.method, resource: req.url, ip: req.ip };

    return next.handle().pipe(
      tap({
        next: () => this.audit(meta, { status: "success", duration: Date.now() - start }),
        error: () => this.audit(meta, { status: "error", duration: Date.now() - start }),
      }),
    );
  }

  private audit(
    meta: { userId?: number; action: string; resource: string; ip?: string },
    detail: Record<string, any>,
  ) {
    this.auditService
      .log({ ...meta, detail })
      .catch((e) => this.logger.warn("审计日志写入失败", e));
  }
}
