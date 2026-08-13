import { Module } from "@nestjs/common";

import { AppConfigModule } from "./config/config.module.ts";

@Module({
  imports: [AppConfigModule],
  controllers: [],
})
export class AppModule {}
