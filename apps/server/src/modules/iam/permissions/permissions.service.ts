import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreatePermissionDto } from "./dto/create-permission.dto";
import { UpdatePermissionDto } from "./dto/update-permission.dto";
import { Permission } from "./entities/permission.entity";

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  findAll() {
    return this.permissionRepository.find();
  }

  async findById(id: number) {
    const permission = await this.permissionRepository.findOne({ where: { id } });
    if (!permission) throw new NotFoundException("权限不存在");
    return permission;
  }

  create(dto: CreatePermissionDto) {
    return this.permissionRepository.save(
      this.permissionRepository.create(dto),
    );
  }

  async update(id: number, dto: UpdatePermissionDto) {
    const permission = await this.permissionRepository.findOne({ where: { id } });
    if (!permission) throw new NotFoundException("权限不存在");
    Object.assign(permission, dto);
    return this.permissionRepository.save(permission);
  }

  async delete(id: number) {
    const result = await this.permissionRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException("权限不存在");
  }
}
