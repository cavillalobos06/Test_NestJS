
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService, AppUser } from '../auth.service.js'

interface AuthenticatedRequest extends Request {
  user?: AppUser;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    const userId = request.headers['x-user'];

    if (typeof userId !== 'string' || !userId.trim()) {
      throw new UnauthorizedException(
        'Falta el encabezado x-user',
      );
    }

    const usuario = this.authService.findUser(userId.trim());

    if (!usuario) {
      throw new ForbiddenException(
        'El usuario indicado no está autorizado',
      );
    }

    request.user = usuario;

    return true;
  }
}
