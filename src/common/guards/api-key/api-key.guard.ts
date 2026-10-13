// Ruta: src/common/guards/api-key/api-key.guard.ts

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Guard de seguridad que valida el encabezado 'x-api-key' contra las claves autorizadas en la configuración
@Injectable()
export class ApiKeyGuard implements CanActivate {
 constructor(private readonly configService: ConfigService){}

 // Verifica si la petición incluye una API Key válida
 canActivate(context: ExecutionContext): boolean {
  const request = context.switchToHttp().getRequest();

  const apiKey = request.headers["x-api-key"];

  const configuredKeys = this.configService.get<string>('API_KEYS', '').split(',').map((key) => key.trim()).filter(Boolean);

  if(typeof apiKey !== 'string' || configuredKeys.length === 0 || !configuredKeys.includes(apiKey)){
    throw new UnauthorizedException('API Key inválida')
  }

  return true;
 }
}
