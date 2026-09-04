import { Module } from "@nestjs/common";

import { IamBootstrapService } from "./iam-bootstrap.service";

@Module({
  providers: [IamBootstrapService],
})
export class IamBootstrapModule {}
