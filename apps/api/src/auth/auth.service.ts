import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthResponseDto, LoginDto, RegisterUserDto, UserRole } from '@shared';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserEntity } from '@entities';
import { JwtPayload } from './types/jwt-payload.type';

const DEFAULT_BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async register(payload: RegisterUserDto): Promise<AuthResponseDto> {
    const email = this.normalizeEmail(payload.email);
    const existingUser = await this.usersRepository.findOne({ where: { email } });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = this.usersRepository.create({
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      email,
      passwordHash: await this.hashPassword(payload.password),
      role: UserRole.USER,
    });

    const savedUser = await this.usersRepository.save(user);
    const accessToken = await this.issueAccessToken(savedUser);

    return AuthResponseDto.fromEntity(savedUser, accessToken);
  }

  async login(payload: LoginDto): Promise<AuthResponseDto> {
    const email = this.normalizeEmail(payload.email);
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user || !(await this.verifyPassword(payload.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.issueAccessToken(user);

    return AuthResponseDto.fromEntity(user, accessToken);
  }

  async hashPassword(password: string): Promise<string> {
    if (!password) {
      throw new BadRequestException('Password is required');
    }

    return bcrypt.hash(password, DEFAULT_BCRYPT_SALT_ROUNDS);
  }

  async verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    if (!password || !passwordHash) {
      return false;
    }

    return bcrypt.compare(password, passwordHash);
  }

  async issueAccessToken(user: UserEntity): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.signAsync(payload);
  }

  private normalizeEmail(email: string): string {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      throw new BadRequestException('Email is required');
    }

    return normalizedEmail;
  }
}
