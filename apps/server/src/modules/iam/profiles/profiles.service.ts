import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { User } from "../users/entities/user.entity";
import { CreateProfileDto } from "./dto/create-profile.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { Profile } from "./entities/profile.entity";

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  /** 创建用户资料，注册时自动调用 */
  async create(user: User, dto?: CreateProfileDto): Promise<Profile> {
    return this.profileRepository.save(
      this.profileRepository.create({
        user,
        nickname: dto?.nickname ?? "",
        avatar: dto?.avatar ?? "",
        bio: dto?.bio ?? "",
      }),
    );
  }

  /** 获取当前用户资料 */
  findMyProfile(userId: number): Promise<Profile | null> {
    return this.profileRepository.findOne({
      where: { user: { id: userId } },
      relations: { user: true },
    });
  }

  /** 更新当前用户资料 */
  async updateMyProfile(userId: number, dto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.profileRepository.findOneOrFail({
      where: { user: { id: userId } },
    });
    Object.assign(profile, dto);
    return this.profileRepository.save(profile);
  }
}
