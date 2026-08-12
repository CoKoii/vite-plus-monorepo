import { Controller, Get, Logger } from "@nestjs/common";

@Controller("user")
export class UserController {
  private readonly logger = new Logger(UserController.name);

  @Get("log-test")
  logTest() {
    this.logger.log("A log message");
    this.logger.warn("A warning message");
    this.logger.error("An error message");
    this.logger.debug("A debug message");
    this.logger.verbose("A verbose message");

    return { message: "Log messages written" };
  }
}
