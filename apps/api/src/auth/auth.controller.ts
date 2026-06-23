import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  Logger,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthResponseDto, LoginDto, RegisterUserDto } from '@shared';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtAuthInterceptor } from './interceptors/jwt-auth.interceptor';
import { RequestUser } from './types/authenticated-request.type';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() payload: RegisterUserDto): Promise<AuthResponseDto> {
    try {
      const response = await this.authService.register(payload);

      this.logger.log(`Registered user with id ${response.user.id}`);

      return response;
    } catch (error) {
      this.logger.error(`Failed to register user: ${this.getErrorMessage(error)}`);
      throw this.toHttpException(error);
    }
  }

  @Post('login')
  async login(@Body() payload: LoginDto): Promise<AuthResponseDto> {
    try {
      const response = await this.authService.login(payload);

      this.logger.log(`Authenticated user with id ${response.user.id}`);

      return response;
    } catch (error) {
      this.logger.error(`Failed to authenticate user: ${this.getErrorMessage(error)}`);
      throw this.toHttpException(error);
    }
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(JwtAuthInterceptor)
  @Get('me')
  getMe(@CurrentUser() user: RequestUser): RequestUser {
    this.logger.log(`Returned authenticated user with id ${user.id}`);

    return user;
  }

  private toHttpException(error: unknown): HttpException {
    if (error instanceof HttpException) {
      return error;
    }

    return new BadRequestException(this.getErrorMessage(error));
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unexpected authentication error';
  }
}
