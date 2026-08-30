import { Body, Controller, Get, Patch } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { User } from "../users/entities/user.entity";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { Profile } from "./entities/profile.entity";
import { ProfilesService } from "./profiles.service";

@Controller("profiles")
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  /** 获取当前用户资料 */
  @Get("me")
  getMyProfile(@CurrentUser() user: User): Promise<Profile | null> {
    return this.profilesService.findMyProfile(user.id);
  }

  /** 更新当前用户资料 */
  @Patch("me")
  updateMyProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto): Promise<Profile> {
    return this.profilesService.updateMyProfile(user.id, dto);
  }
}
