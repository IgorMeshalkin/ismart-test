import { UserRole } from '@shared';

export type RequestUser = {
  id: string;
  email: string;
  role: UserRole;
};

export type AuthenticatedRequest = {
  headers: {
    authorization?: string;
  };
  user?: RequestUser;
};
