import { Injectable } from "@nestjs/common";

import { CreateProfileDto } from "./dto/create-profile.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class ProfilesService {
  create(createProfileDto: CreateProfileDto) {
    console.log("createProfileDto", createProfileDto);
    return "This action adds a new profile";
  }

  findAll() {
    return `This action returns all profiles`;
  }

  findOne(id: number) {
    return `This action returns a #${id} profile`;
  }

  update(id: number, updateProfileDto: UpdateProfileDto) {
    console.log("updateProfileDto", updateProfileDto);
    return `This action updates a #${id} profile`;
  }

  remove(id: number) {
    return `This action removes a #${id} profile`;
  }
}
