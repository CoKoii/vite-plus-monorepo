import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";

import { Role } from "../../roles/entities/role.entity";

@Entity({ comment: "用户账户" })
export class User {
  @PrimaryGeneratedColumn({ comment: "用户ID" })
  id!: number;

  @Column({ comment: "邮箱", unique: true })
  email!: string;

  @Column({ comment: "密码", select: false })
  password!: string;

  @Column({ comment: "状态 1=启用 0=禁用", default: 1 })
  status!: number;

  @ManyToMany(() => Role)
  @JoinTable({
    name: "user_role",
    joinColumn: { name: "user_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "role_id", referencedColumnName: "id" },
  })
  roles!: Role[];
}
