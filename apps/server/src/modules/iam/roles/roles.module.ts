import { Module, OnModuleInit } from "@nestjs/common";
import { InjectDataSource, TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

import { AuthModule } from "../auth/auth.module";
import { Permission } from "../permissions/entities/permission.entity";
import { PermissionsModule } from "../permissions/permissions.module";
import { RolesController } from "./roles.controller";
import { RolesService } from "./roles.service";
import { Role } from "./entities/role.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission]),
    AuthModule,
    PermissionsModule,
  ],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule implements OnModuleInit {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    // 确保 user_roles_role 的 roleId FK 为 ON DELETE RESTRICT
    // TypeORM @JoinTable 默认创建 CASCADE，synchronize 不会更新已有约束
    await this.dataSource.query(`
      DO $$
      DECLARE
        fk_name TEXT;
      BEGIN
        SELECT con.conname INTO fk_name
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'user_roles_role'
          AND con.contype = 'f'
          AND pg_get_constraintdef(con.oid) LIKE '%REFERENCES role(id)%'
          AND pg_get_constraintdef(con.oid) LIKE '%ON DELETE CASCADE%';

        IF fk_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE user_roles_role DROP CONSTRAINT %I', fk_name);
          EXECUTE format(
            'ALTER TABLE user_roles_role ADD CONSTRAINT %I FOREIGN KEY ("roleId") REFERENCES role(id) ON DELETE RESTRICT',
            fk_name
          );
        END IF;
      END $$;
    `);
  }
}
