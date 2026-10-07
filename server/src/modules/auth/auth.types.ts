import { UserRole, UserStatus } from '../../database/enums/domain.enums';

export interface JwtPayload {
  sub: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  id: number;
  username: string | null;
  email: string | null;
  fullName: string;
  role: UserRole;
  status: UserStatus;
}
