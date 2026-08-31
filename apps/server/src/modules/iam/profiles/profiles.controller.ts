import { Body, Controller, Get, Patch } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { User } from "../users/entities/user.entity";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ProfilesService } from "./profiles.service";

/** 当前用户资料接口 */
@Controller("profiles")
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get("me")
  getMyProfile(@CurrentUser() user: User) {
    return this.profilesService.findMyProfile(user.id);
  }

  @Patch("me")
  updateMyProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.profilesService.updateMyProfile(user.id, dto);
  }
}
