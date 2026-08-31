import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { UpdateProfileDto } from "./dto/update-profile.dto";
import { Profile } from "./entities/profile.entity";

/** 用户资料服务，自动创建空资料 */
@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  findMyProfile(userId: number) {
    return this.profileRepository.findOne({
      where: { user: { id: userId } },
      relations: { user: true },
    });
  }

  async updateMyProfile(userId: number, dto: UpdateProfileDto) {
    let profile = await this.profileRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!profile) {
      profile = this.profileRepository.create({ user: { id: userId } as any });
    }
    Object.assign(profile, dto);
    return this.profileRepository.save(profile);
  }
}
