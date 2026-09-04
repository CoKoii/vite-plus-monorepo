import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ResourceNotFoundException } from "../../../common/errors/business.exception";
import { AuthorizationService } from "../authorization/authorization.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { Profile } from "./entities/profile.entity";

/** 用户资料服务，自动创建空资料 */
@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async findMyProfile(userId: number) {
    const profile = await this.profileRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!profile) throw new ResourceNotFoundException("用户资料不存在");
    const [roles, permissions] = await Promise.all([
      this.authorizationService.getRoles(userId),
      this.authorizationService.getPermissions(userId),
    ]);

    return Object.assign({}, profile, {
      permissions: [...permissions],
      roles: [...roles],
    });
  }

  async updateMyProfile(userId: number, dto: UpdateProfileDto) {
    let profile = await this.profileRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!profile) {
      profile = this.profileRepository.create({ user: { id: userId } });
    }
    Object.assign(profile, dto);
    return this.profileRepository.save(profile);
  }
}
