import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthenticatedRequest } from '../types/authenticated-request.type';
import { JwtRequestValidatorService } from '../utils/jwt-request-validator.service';

@Injectable()
export class JwtAuthInterceptor implements NestInterceptor {
  constructor(private readonly jwtRequestValidator: JwtRequestValidatorService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    await this.jwtRequestValidator.validate(request);

    return next.handle();
  }
}
