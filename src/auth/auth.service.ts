// Ruta: src/auth/auth.service.ts

import { Injectable } from '@nestjs/common';

// Tipo que define los roles disponibles en el sistema
export type UserRole = 'admin' | 'supervisor' | 'asesor';

// Interfaz que define la estructura del usuario autenticado
export interface AppUser {
  id: string;
  rol: UserRole;
}

// Servicio encargado de gestionar y consultar los usuarios autorizados
@Injectable()
export class AuthService {
  // Lista simulada de usuarios en memoria con sus respectivos roles
  private readonly usuarios: AppUser[] = [
    { id: 'admin01', rol: 'admin' },
    { id: 'supervisor01', rol: 'supervisor' },
    { id: 'asesor01', rol: 'asesor' },
    { id: 'asesor02', rol: 'asesor' },
  ];

  // Busca un usuario por su ID; retorna undefined si no existe
  findUser(id: string): AppUser | undefined {
    return this.usuarios.find((usuario) => usuario.id === id);
  }
}

