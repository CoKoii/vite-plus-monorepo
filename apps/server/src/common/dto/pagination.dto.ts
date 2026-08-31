import { IsInt, IsOptional, Max, Min } from "class-validator";
import { Type } from "class-transformer";

/** 分页查询参数，page 从 1 开始 */
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
  @Max(100)
  pageSize?: number = 20;
}

/** 分页响应结构，包含列表和元信息 */
export class PaginatedResult<T> {
  items!: T[];
  meta!: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
