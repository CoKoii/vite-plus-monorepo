import { Module } from "@nestjs/common";

import { UserController } from "./user.controller.ts";

@Module({
  controllers: [UserController],
})
export class UserModule {}
