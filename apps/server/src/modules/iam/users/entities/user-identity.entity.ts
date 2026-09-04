import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";

import { BaseEntity } from "../../../../common/entities/base.entity";
import { User } from "./user.entity";

/** 外部登录身份，例如 GitHub、微信或 Apple 账号。 */
@Entity({ name: "user_identities", comment: "用户登录身份" })
@Index("UQ_user_identity_provider_account", ["provider", "providerAccountId"], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class UserIdentity extends BaseEntity {
  @Column({ length: 50, comment: "身份提供商" })
  provider!: string;

  @Column({ name: "provider_account_id", length: 255, comment: "提供商账号 ID" })
  providerAccountId!: string;

  @ManyToOne(() => User, (user) => user.identities, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;
}
