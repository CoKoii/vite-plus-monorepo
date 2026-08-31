import { Column, Entity, JoinTable, ManyToMany } from "typeorm";

import { BaseEntity } from "../../../../common/entities/base.entity";
import { Permission } from "../../permissions/entities/permission.entity";

@Entity({ comment: "角色" })
export class Role extends BaseEntity {
  @Column({ comment: "角色名称", length: 50 })
  name!: string;

  @Column({ comment: "角色编码", length: 50, unique: true })
  code!: string;

  @Column({ comment: "角色描述", length: 200, default: "" })
  description!: string;

  @Column({ comment: "状态 1=启用 0=禁用", default: 1 })
  status!: number;

  @ManyToMany(() => Permission)
  @JoinTable()
  permissions!: Permission[];
}
