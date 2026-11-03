import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { UserRole } from '../../../database/enums/domain.enums';
import { AuthenticatedUser } from '../../auth/auth.types';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

function requestsOwnGroups(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase();
  return normalized === 'true' || normalized === '1';
}

/**
 * `GET /groups` remains public for group discovery, while the legacy
 * `?mine=true` alias still requires the same active student identity as
 * `/groups/mine`.
 */
@Injectable()
export class GroupsListAuthGuard implements CanActivate {
  constructor(private readonly jwtAuthGuard: JwtAuthGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();
    if (!requestsOwnGroups(request.query.mine)) return true;

    await this.jwtAuthGuard.canActivate(context);
    if (request.user?.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
    }
    return true;
  }
}
