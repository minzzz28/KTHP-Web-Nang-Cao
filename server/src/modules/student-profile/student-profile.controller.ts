import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateStudentProfileDto } from './dto/create-student-profile.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { StudentProfileService } from './student-profile.service';

@Controller('student-profiles')
export class StudentProfileController {
  constructor(private readonly studentProfileService: StudentProfileService) {}

  @Post()
  create(@Body() createStudentProfileDto: CreateStudentProfileDto) {
    return this.studentProfileService.create(createStudentProfileDto);
  }

  @Get()
  findAll() {
    return this.studentProfileService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.studentProfileService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStudentProfileDto: UpdateStudentProfileDto,
  ) {
    return this.studentProfileService.update(id, updateStudentProfileDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.studentProfileService.remove(id);
  }
}