// Ruta: src/common/guards/user/user.guard.ts

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../../auth/auth.service.js';

// Guard que autentica al usuario mediante el encabezado 'x-user' y lo asocia a la petición
@Injectable()
export class UserGuard implements CanActivate {
  constructor(private readonly authService: AuthService){}

  // Valida la existencia del identificador de usuario y lo inyecta en el objeto Request
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const userId = request.headers['x-user'];

    if(typeof userId !== 'string' || !userId.trim()) {
      throw new UnauthorizedException('El encabezado de x-user es obligatorio')
    }

    const user = this.authService.findUser(userId)

    if(!user) {
      throw new UnauthorizedException('Usuario no reconocido')
    }

    request.user = user;

    return true;
  }
}
