import { ParseIntPipe } from "@nestjs/common";

import { ValidationException } from "../errors/business.exception";

/** 统一资源 ID 的校验错误文案。 */
export class ParseIdPipe extends ParseIntPipe {
  constructor() {
    super({ exceptionFactory: () => new ValidationException("资源 ID 必须是整数") });
  }
}
