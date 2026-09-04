import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";

import { AuditService } from "./audit.service";

/** 自动审计写操作，不阻塞主请求。 */
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
        next: () =>
          this.auditService.log({
            ...meta,
            detail: { status: "success", duration: Date.now() - start },
          }),
        error: () =>
          this.auditService.log({
            ...meta,
            detail: { status: "error", duration: Date.now() - start },
          }),
      }),
    );
  }
}
