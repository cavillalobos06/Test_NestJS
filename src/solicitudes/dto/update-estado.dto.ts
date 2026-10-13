// Ruta: src/solicitudes/dto/update-estado.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, Min } from 'class-validator';
import { EstadoSolicitud } from '../entities/solicitud.entity.js';

// DTO que valida el nuevo estado enviado para actualizar una solicitud
export class UpdateEstadoDto {
  @ApiProperty({ enum: EstadoSolicitud, example: EstadoSolicitud.EN_GESTION })
  @IsEnum(EstadoSolicitud, {
    message: "El Estado Debe Ser: 'PENDIENTE', 'EN_GESTION', 'RESUELTA'",
  })
  estado: EstadoSolicitud;

  @ApiProperty({
    example: 1,
    minimum: 1,
    description: 'Versión que tenía la solicitud cuando fue consultada',
  })
  @IsInt()
  @Min(1)
  versionEsperada: number;
}
