import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ comment: "权限" })
export class Permission {
  @PrimaryGeneratedColumn({ comment: "权限ID" })
  id!: number;

  @Column({ comment: "权限名称", length: 50 })
  name!: string;

  @Column({ comment: "权限编码", length: 100, unique: true })
  code!: string;

  @Column({ comment: "权限描述", length: 200, default: "" })
  description!: string;

  @Column({ comment: "状态 1=启用 0=禁用", default: 1 })
  status!: number;
}
