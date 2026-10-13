// Ruta: src/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { ApiKeyGuard } from '../common/guards/api-key/api-key.guard.js';
import { UserGuard } from '../common/guards/user/user.guard.js';
import { RolesGuard } from '../common/guards/roles/roles.guard.js';
import { AuthService } from './auth.service.js';

// Módulo de autenticación: declara y exporta el servicio de autenticación y los guards de seguridad
@Module({
  providers: [AuthService, ApiKeyGuard, RolesGuard, UserGuard],
  exports: [AuthService, ApiKeyGuard, UserGuard, RolesGuard],
})
export class AuthModule {}
