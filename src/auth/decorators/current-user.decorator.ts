// Ruta: src/auth/decorators/current-user.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AppUser } from '../auth.service.js';

// Decorador personalizado para inyectar el usuario autenticado (request.user) en los parámetros de los controladores
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AppUser => {
    const request = context
      .switchToHttp()
      .getRequest<{ user: AppUser }>();

    return request.user;
  },
);
