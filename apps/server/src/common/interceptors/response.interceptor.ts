import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from "@nestjs/common";
import { Observable, map } from "rxjs";

/** 统一响应格式拦截器，所有成功响应包装为 { code, data, requestId } */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<{ id: string }>();
    return next.handle().pipe(
      map((data) => ({
        code: 0,
        requestId: request.id,
        data,
      })),
    );
  }
}
