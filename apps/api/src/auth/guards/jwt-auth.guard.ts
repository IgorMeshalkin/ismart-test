import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthenticatedRequest } from '../types/authenticated-request.type';
import { JwtRequestValidatorService } from '../utils/jwt-request-validator.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtRequestValidator: JwtRequestValidatorService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      await this.jwtRequestValidator.validate(request);
    }

    return Boolean(request.user);
  }
}
