import { Check, Column, Entity, JoinTable, ManyToMany } from "typeorm";

import { BaseEntity } from "../../../../common/entities/base.entity";
import { Permission } from "../../permissions/entities/permission.entity";
import { User } from "../../users/entities/user.entity";

@Entity({ comment: "角色" })
@Check('"status" IN (0, 1)')
@Check('"level" >= 0')
export class Role extends BaseEntity {
  @Column({ comment: "角色名称", length: 50 })
  name!: string;

  @Column({ comment: "角色编码", length: 50, unique: true })
  code!: string;

  @Column({ comment: "角色描述", length: 200, default: "" })
  description!: string;

  @Column({ comment: "角色等级，数值越大权限越高", default: 0 })
  level!: number;

  @Column({ comment: "是否系统内置角色", default: false })
  isSystem!: boolean;

  @Column({ comment: "状态 1=启用 0=禁用", default: 1 })
  status!: number;

  /** 反向关联，仅用于控制 join table 的 roleId FK 为 ON DELETE RESTRICT */
  @ManyToMany(() => User, (user) => user.roles, { onDelete: "RESTRICT" })
  users?: User[];

  @ManyToMany(() => Permission)
  @JoinTable()
  permissions!: Permission[];
}
