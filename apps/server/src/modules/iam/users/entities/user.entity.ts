import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ comment: "用户账号" })
export class User {
  @PrimaryGeneratedColumn({ comment: "用户ID" })
  id!: number;

  @Column({ comment: "账号", unique: true })
  account!: string;

  @Column({ comment: "密码" })
  password!: string;

  @Column({ comment: "状态", default: 1 })
  status!: number;
}
