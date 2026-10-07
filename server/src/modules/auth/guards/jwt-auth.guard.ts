import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import { Repository } from 'typeorm';
import {
  cookieAccessToken,
  requireSessionUser,
} from '../../../common/auth/auth-session';
import { User } from '../../../database/entities/identity/user.entity';
import { UserStatus } from '../../../database/enums/domain.enums';
import { AuthenticatedUser, JwtPayload } from '../auth.types';

type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

function bearerToken(header: string | undefined): string | null {
  if (!header) return null;

  const parts = header.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) return null;

  return parts[1];
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const bearer = bearerToken(request.headers.authorization);
    const token = bearer ?? cookieAccessToken(request);

    if (!token) {
      throw new UnauthorizedException('Vui lòng đăng nhập để tiếp tục');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        algorithms: ['HS256'],
      });
    } catch {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn');
    }

    const userId = Number(payload.sub);
    if (!Number.isSafeInteger(userId) || userId < 1) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }

    const user = await this.users.findOneBy({ id: userId });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Tài khoản không còn hoạt động');
    }

    // A browser request that authenticates with the HttpOnly cookie must also
    // belong to the server-side session created at login. Bearer tokens remain
    // supported for the existing Socket.IO and API clients.
    if (!bearer) {
      try {
        requireSessionUser(request, user.id);
      } catch {
        throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn');
      }
    }

    request.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
    };

    return true;
  }
}
