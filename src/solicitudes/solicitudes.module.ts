// Ruta: src/solicitudes/solicitudes.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolicitudEntity } from './entities/solicitud.entity.js';
import { SolicitudesController } from './solicitudes.controller.js';
import { SolicitudesService } from './solicitudes.service.js';
import { AuthModule } from '../auth/auth.module.js';

// Módulo que agrupa los componentes del dominio de solicitudes (entidad, controlador y servicio)
@Module({
  imports: [TypeOrmModule.forFeature([SolicitudEntity]), AuthModule],
  controllers: [SolicitudesController],
  providers: [SolicitudesService],
})
export class SolicitudesModule {}
