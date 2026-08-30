import { Column, Entity } from "typeorm";

import { BaseEntity } from "../../../common/entities/base.entity";

@Entity({ comment: "审计日志" })
export class AuditLog extends BaseEntity {
  @Column({ comment: "用户 ID", nullable: true })
  userId?: number;

  @Column({ comment: "操作类型", length: 50 })
  action!: string;

  @Column({ comment: "操作资源", length: 100 })
  resource!: string;

  @Column({ comment: "资源 ID", nullable: true })
  resourceId?: number;

  @Column({ comment: "请求 IP", length: 50, nullable: true })
  ip?: string;

  @Column({ comment: "操作详情", type: "json", nullable: true })
  detail?: Record<string, any>;
}
