import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NearbyPlace, Property, Room } from '../../database/entities';
import { AuthModule } from '../auth/auth.module';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([NearbyPlace, Property, Room]),
  ],
  controllers: [PropertiesController],
  providers: [PropertiesService],
})
export class PropertiesModule {}
