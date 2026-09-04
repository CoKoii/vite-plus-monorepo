import { Check, Column, Entity, JoinTable, ManyToMany, OneToMany } from "typeorm";

import { BaseEntity } from "../../../../common/entities/base.entity";
import { Role } from "../../roles/entities/role.entity";
import { UserIdentity } from "./user-identity.entity";

@Entity({ comment: "用户账户" })
@Check('"status" IN (0, 1)')
export class User extends BaseEntity {
  @Column({ type: "varchar", comment: "邮箱账号", unique: true, nullable: true })
  email!: string | null;

  @Column({ type: "varchar", comment: "密码哈希", select: false, nullable: true })
  passwordHash!: string | null;

  @Column({ comment: "状态", default: 1 })
  status!: number;

  @Column({ type: "timestamptz", nullable: true, comment: "邮箱验证时间" })
  emailVerifiedAt!: Date | null;

  @ManyToMany(() => Role, { onDelete: "RESTRICT" })
  @JoinTable()
  roles!: Role[];

  @OneToMany(() => UserIdentity, (identity) => identity.user)
  identities!: UserIdentity[];
}
