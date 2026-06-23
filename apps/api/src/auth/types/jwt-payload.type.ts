import { UserRole } from '@shared';

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};
