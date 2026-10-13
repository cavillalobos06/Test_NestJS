// Ruta: src/common/interceptors/response.interceptor.ts

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

// Interceptor global que transforma y estandariza todas las respuestas exitosas de la API en el formato { success: true, data }
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  // Intercepta la respuesta del controlador antes de ser enviada al cliente
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(map((data) => ({ success: true, data })));
  }
}
