import { Column, Entity, JoinTable, ManyToMany } from "typeorm";

import { BaseEntity } from "../../../../common/entities/base.entity";
import { Role } from "../../roles/entities/role.entity";

@Entity({ comment: "用户账户" })
export class User extends BaseEntity {
  @Column({ comment: "邮箱", unique: true })
  email!: string;

  @Column({ comment: "密码", select: false })
  password!: string;

  @Column({ comment: "状态", default: 1 })
  status!: number;

  @ManyToMany(() => Role)
  @JoinTable()
  roles!: Role[];
}
