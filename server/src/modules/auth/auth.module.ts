import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { StringValue } from 'ms';
import { LandlordProfile, StudentProfile, User } from '../../database/entities';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

const JWT_EXPIRY_PATTERN = /^\d+(?:\.\d+)?\s*(?:ms|s|m|h|d|w|y)$/i;

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, StudentProfile, LandlordProfile]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret || secret.length < 32) {
          throw new Error('JWT_SECRET must contain at least 32 characters.');
        }

        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') ?? '7d';
        if (!JWT_EXPIRY_PATTERN.test(expiresIn)) {
          throw new Error(
            'JWT_EXPIRES_IN must be a positive duration such as "7d" or "12h".',
          );
        }

        return {
          secret,
          signOptions: {
            algorithm: 'HS256' as const,
            expiresIn: expiresIn as StringValue,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RolesGuard],
  // JwtAuthGuard loads the current User from the database. Re-exporting this
  // feature repository lets any module using the guard resolve that dependency
  // without duplicating `TypeOrmModule.forFeature([User])` everywhere.
  exports: [AuthService, JwtAuthGuard, RolesGuard, JwtModule, TypeOrmModule],
})
export class AuthModule {}
