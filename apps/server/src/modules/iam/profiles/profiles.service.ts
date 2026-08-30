import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { UpdateProfileDto } from "./dto/update-profile.dto";
import { Profile } from "./entities/profile.entity";

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  /** 获取当前用户资料 */
  findMyProfile(userId: number): Promise<Profile | null> {
    return this.profileRepository.findOne({
      where: { user: { id: userId } },
      relations: { user: true },
    });
  }

  /** 更新当前用户资料 */
  async updateMyProfile(userId: number, dto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!profile) throw new NotFoundException("用户资料不存在");
    Object.assign(profile, dto);
    return this.profileRepository.save(profile);
  }
}
