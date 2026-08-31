import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { Role } from "../roles/entities/role.entity";
import { User } from "./entities/user.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  findByEmail(email: string, selectPassword = false) {
    const qb = this.userRepository.createQueryBuilder("user").where("user.email = :email", { email });
    if (selectPassword) qb.addSelect("user.password");
    return qb.getOne();
  }

  findById(id: number) {
    return this.userRepository.findOne({ where: { id } });
  }

  create(email: string, password: string) {
    return this.userRepository.save(this.userRepository.create({ email, password }));
  }

  findAll() {
    return this.userRepository.find({ relations: { roles: { permissions: true } } });
  }

  async updateRoles(id: number, roleIds: number[]) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: { roles: true },
    });
    if (!user) throw new NotFoundException("用户不存在");

    user.roles = roleIds.length
      ? await this.roleRepository.findBy({ id: In(roleIds) })
      : [];
    return this.userRepository.save(user);
  }
}
