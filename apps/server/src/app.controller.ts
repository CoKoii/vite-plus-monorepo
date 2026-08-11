import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Controller()
export class AppController {
  constructor(private configService: ConfigService) {}

  @Get()
  getHello(): string {
    const dbHost = this.configService.get("DB_HOST");
    console.log("DB_HOST:", dbHost);
    return "";
  }
}
