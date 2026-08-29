import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common";
import { map, type Observable } from "rxjs";

/* 统一成功响应格式 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, unknown> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ id?: string }>();
    return next.handle().pipe(
      map((data) => ({
        code: "SUCCESS",
        requestId: request.id ?? null,
        data: data ?? null,
      })),
    );
  }
}
