import { CreateDateColumn, DeleteDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

/** 所有实体共用的基础字段 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn({ comment: "ID" })
  id!: number;

  @CreateDateColumn({ comment: "创建时间", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ comment: "更新时间", type: "timestamptz" })
  updatedAt!: Date;

  @DeleteDateColumn({ comment: "软删除时间" })
  deletedAt!: Date | null;
}
