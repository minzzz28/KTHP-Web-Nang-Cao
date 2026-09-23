import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentProfile } from '../../database/entities/identity/student-profile.entity';
import { StudentProfileController } from './student-profile.controller';
import { studentProfileProviders } from './student-profile.providers';
import { StudentProfileService } from './student-profile.service';

@Module({
  imports: [TypeOrmModule.forFeature([StudentProfile])],
  controllers: [StudentProfileController],
  providers: [StudentProfileService, ...studentProfileProviders],
  exports: [StudentProfileService],
})
export class StudentProfileModule {}