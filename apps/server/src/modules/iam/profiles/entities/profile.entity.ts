import { Column, Entity, JoinColumn, OneToOne } from "typeorm";

import { BaseEntity } from "../../../../common/entities/base.entity";
import { User } from "../../users/entities/user.entity";

@Entity({ comment: "用户资料" })
export class Profile extends BaseEntity {
  @OneToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ comment: "昵称", length: 50, default: "" })
  nickname!: string;

  @Column({ comment: "头像 URL", length: 500, default: "" })
  avatar!: string;

  @Column({ comment: "个人简介", length: 500, default: "" })
  bio!: string;
}
