import { PartialType } from "@nestjs/mapped-types";

import { CreateAuthDto } from "./register-auth.dto";

export class UpdateAuthDto extends PartialType(CreateAuthDto) {}
