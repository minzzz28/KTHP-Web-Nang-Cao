import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentProfile } from '../../database/entities/identity/student-profile.entity';

export const STUDENT_PROFILE_REPOSITORY = 'STUDENT_PROFILE_REPOSITORY';

export const studentProfileProviders = [
  {
    provide: STUDENT_PROFILE_REPOSITORY,
    useFactory: (repository: Repository<StudentProfile>) => repository,
    inject: [getRepositoryToken(StudentProfile)],
  },
];