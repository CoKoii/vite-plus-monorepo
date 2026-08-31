import { IsInt, IsOptional, Min } from "class-validator";
import { Type } from "class-transformer";

/** 分页查询参数 */
export class PaginationQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20;
}

/** 分页响应 */
export class PaginatedResult<T> {
  items!: T[];
  meta!: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
