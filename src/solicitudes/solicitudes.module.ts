// Ruta: src/solicitudes/solicitudes.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';

import { Solicitud } from './entities/solicitud.entity.js';
import { SolicitudHistorial } from './entities/solicitud-historial.entity.js';

import { SolicitudesController } from './solicitudes.controller.js';
import { SolicitudesService } from './solicitudes.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Solicitud,
      SolicitudHistorial,
    ]),
    AuthModule,
  ],

  controllers: [SolicitudesController],
  providers: [SolicitudesService],
  exports: [SolicitudesService]
})
export class SolicitudesModule {}