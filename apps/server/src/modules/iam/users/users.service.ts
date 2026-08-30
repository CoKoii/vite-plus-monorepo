import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { User } from "./entities/user.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /** 按邮箱查找用户 */
  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /** 按邮箱查找用户，包含密码字段 */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.email = :email", { email })
      .getOne();
  }

  /** 按 ID 查找用户 */
  findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  /** 创建用户 */
  create(email: string, password: string): Promise<User> {
    return this.userRepository.save(this.userRepository.create({ email, password }));
  }
}
