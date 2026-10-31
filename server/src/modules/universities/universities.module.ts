import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { University } from '../../database/entities/location/university.entity';
import { AuthModule } from '../auth/auth.module';
import { UniversitiesController } from './universities.controller';
import { UniversitiesService } from './universities.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([University])],
  controllers: [UniversitiesController],
  providers: [UniversitiesService],
  exports: [UniversitiesService],
})
export class UniversitiesModule {}
