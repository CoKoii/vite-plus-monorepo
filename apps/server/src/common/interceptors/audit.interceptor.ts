import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";

import { AuditService } from "../../modules/audit/audit.service";

/** 自动审计拦截器，记录所有写操作；异步批量写入，不影响主流程 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
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
        next: () => this.auditService.log({ ...meta, detail: { status: "success", duration: Date.now() - start } }),
        error: () => this.auditService.log({ ...meta, detail: { status: "error", duration: Date.now() - start } }),
      }),
    );
  }
}
