import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { StudentProfile } from '../../database/entities/identity/student-profile.entity';
import { CreateStudentProfileDto } from './dto/create-student-profile.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { STUDENT_PROFILE_REPOSITORY } from './student-profile.providers';

@Injectable()
export class StudentProfileService {
  constructor(
    @Inject(STUDENT_PROFILE_REPOSITORY)
    private readonly studentProfileRepository: Repository<StudentProfile>,
  ) {}

  create(createStudentProfileDto: CreateStudentProfileDto) {
    const studentProfile = this.studentProfileRepository.create(
      createStudentProfileDto,
    );

    return this.studentProfileRepository.save(studentProfile);
  }

  findAll() {
    return this.studentProfileRepository.find({
      relations: { user: true, university: true },
    });
  }

  async findOne(id: number) {
    const studentProfile = await this.studentProfileRepository.findOne({
      where: { id },
      relations: { user: true, university: true },
    });

    if (!studentProfile) {
      throw new NotFoundException(`StudentProfile with id ${id} not found`);
    }

    return studentProfile;
  }

  async update(id: number, updateStudentProfileDto: UpdateStudentProfileDto) {
    const studentProfile = await this.studentProfileRepository.preload({
      id,
      ...updateStudentProfileDto,
    });

    if (!studentProfile) {
      throw new NotFoundException(`StudentProfile with id ${id} not found`);
    }

    return this.studentProfileRepository.save(studentProfile);
  }

  async remove(id: number) {
    const studentProfile = await this.findOne(id);
    await this.studentProfileRepository.remove(studentProfile);
  }
}