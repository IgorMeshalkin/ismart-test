import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedRequest, RequestUser } from '../types/authenticated-request.type';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtRequestValidatorService {
  constructor(private readonly jwtService: JwtService) {}

  async validate(request: AuthenticatedRequest): Promise<RequestUser> {
    const token = this.extractBearerToken(request.headers.authorization);
    const payload = await this.verifyToken(token);
    const user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    request.user = user;

    return user;
  }

  private extractBearerToken(authorizationHeader?: string): string {
    if (!authorizationHeader) {
      throw new UnauthorizedException('Authorization token is required');
    }

    const [scheme, token] = authorizationHeader.split(' ');

    if (scheme !== 'Bearer' || !token || authorizationHeader.split(' ').length !== 2) {
      throw new UnauthorizedException('Authorization token must use Bearer scheme');
    }

    return token;
  }

  private async verifyToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      if (!payload.sub || !payload.email || !payload.role) {
        throw new UnauthorizedException('Authorization token payload is invalid');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Authorization token is invalid or expired');
    }
  }
}
