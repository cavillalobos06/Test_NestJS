// Ruta: src/auth/decorators/roles.decorator.ts

import { SetMetadata } from "@nestjs/common";
import { UserRole } from '../auth.service.js';

// Clave utilizada para asociar y leer los roles en los metadatos de la ruta
export const ROLES_KEY = 'roles';

// Decorador para definir qué roles tienen permiso para acceder a una ruta o controlador
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles); 
