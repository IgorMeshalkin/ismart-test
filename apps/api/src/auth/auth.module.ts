import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SignOptions } from 'jsonwebtoken';
import { UserEntity } from '@entities';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtAuthInterceptor } from './interceptors/jwt-auth.interceptor';
import { JwtRequestValidatorService } from './utils/jwt-request-validator.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');

        if (!secret) {
          throw new Error('JWT_SECRET environment variable is required');
        }

        return {
          secret,
          signOptions: {
            expiresIn: (config.get<string>('JWT_EXPIRES_IN') ?? '1h') as SignOptions['expiresIn'],
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtRequestValidatorService, JwtAuthGuard, JwtAuthInterceptor],
  exports: [AuthService, JwtRequestValidatorService, JwtAuthGuard, JwtAuthInterceptor],
})
export class AuthModule {}
