import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectDataSource } from "@nestjs/typeorm";
import * as argon2 from "argon2";
import { DataSource, EntityManager } from "typeorm";

import { BootstrapException } from "../../../common/errors/business.exception";
import { Permission } from "../permissions/entities/permission.entity";
import { Profile } from "../profiles/entities/profile.entity";
import { Role } from "../roles/entities/role.entity";
import { User } from "../users/entities/user.entity";

const DEFAULT_PERMISSIONS = [
  { name: "查看用户", code: "iam:user:read", description: "查看用户列表和详情" },
  { name: "分配用户角色", code: "iam:user:role:assign", description: "为用户分配角色" },
  { name: "查看角色", code: "iam:role:read", description: "查看角色列表和详情" },
  { name: "创建角色", code: "iam:role:create", description: "创建角色" },
  { name: "修改角色", code: "iam:role:update", description: "修改角色" },
  { name: "删除角色", code: "iam:role:delete", description: "删除角色" },
  { name: "查看权限", code: "iam:permission:read", description: "查看权限列表和详情" },
  { name: "创建权限", code: "iam:permission:create", description: "创建权限" },
  { name: "修改权限", code: "iam:permission:update", description: "修改权限" },
  { name: "删除权限", code: "iam:permission:delete", description: "删除权限" },
] as const;

const DEFAULT_ROLES = [
  {
    name: "超级管理员",
    code: "super_admin",
    description: "系统最高权限角色",
    level: 100,
    isSystem: true,
    permissionCodes: DEFAULT_PERMISSIONS.map(({ code }) => code),
  },
  {
    name: "管理员",
    code: "admin",
    description: "负责日常用户管理的角色",
    level: 50,
    isSystem: true,
    permissionCodes: [
      "iam:user:read",
      "iam:user:role:assign",
      "iam:role:read",
      "iam:permission:read",
    ],
  },
] as const;

@Injectable()
export class IamBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(IamBootstrapService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async onApplicationBootstrap() {
    if (!this.configService.get<boolean>("BOOTSTRAP_ENABLED", false)) return;

    await this.dataSource.transaction(async (manager) => {
      const permissions = new Map<string, Permission>();
      const permissionRepository = manager.getRepository(Permission);
      for (const definition of DEFAULT_PERMISSIONS) {
        let permission = await permissionRepository.findOne({
          where: { code: definition.code },
        });
        if (!permission) {
          permission = await permissionRepository.save(permissionRepository.create(definition));
        }
        permissions.set(permission.code, permission);
      }

      const roles = new Map<string, Role>();
      const roleRepository = manager.getRepository(Role);
      for (const definition of DEFAULT_ROLES) {
        let role = await roleRepository.findOne({ where: { code: definition.code } });
        if (!role) {
          role = roleRepository.create({
            name: definition.name,
            code: definition.code,
            description: definition.description,
            level: definition.level,
            isSystem: definition.isSystem,
            permissions: definition.permissionCodes.map((code) => permissions.get(code)!),
          });
          role = await roleRepository.save(role);
        }
        roles.set(role.code, role);
      }

      await this.ensureAccount(
        manager,
        this.configService.getOrThrow<string>("BOOTSTRAP_SUPER_ADMIN_EMAIL"),
        this.configService.getOrThrow<string>("BOOTSTRAP_SUPER_ADMIN_PASSWORD"),
        roles.get("super_admin")!,
      );
      await this.ensureAccount(
        manager,
        this.configService.getOrThrow<string>("BOOTSTRAP_ADMIN_EMAIL"),
        this.configService.getOrThrow<string>("BOOTSTRAP_ADMIN_PASSWORD"),
        roles.get("admin")!,
      );
    });

    this.logger.log("IAM 默认角色、权限和账号初始化完成");
  }

  private async ensureAccount(manager: EntityManager, email: string, password: string, role: Role) {
    const users = manager.getRepository(User);
    const profiles = manager.getRepository(Profile);
    const normalizedEmail = email.trim().toLowerCase();
    let user = await users.findOne({
      where: { email: normalizedEmail },
      relations: { roles: true },
    });

    if (user) {
      if (!user.roles.some((assignedRole) => assignedRole.code === role.code)) {
        throw new BootstrapException("默认账号 " + normalizedEmail + " 未绑定角色 " + role.code);
      }
    } else {
      user = await users.save(
        users.create({
          email: normalizedEmail,
          passwordHash: await argon2.hash(password),
          emailVerifiedAt: new Date(),
          roles: [role],
        }),
      );
    }

    const profile = await profiles.findOne({ where: { user: { id: user.id } } });
    if (!profile) {
      await profiles.save(profiles.create({ nickname: normalizedEmail, user }));
    }
  }
}
