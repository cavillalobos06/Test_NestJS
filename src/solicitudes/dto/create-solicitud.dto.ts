// Ruta: src/solicitudes/dto/create-solicitud.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

// DTO que valida los datos requeridos para registrar una nueva solicitud comercial
export class CreateSolicitudDto {
  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre del cliente' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  cliente: string;

  @ApiProperty({
    example: 'Solicita Información Sobre Los Servicios Comerciales',
    description: 'Motivo de la solicitud',
  })
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiProperty({
    example: 'asesor01',
    description: 'Identificador del asesor responsable',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  asesor: string;
}
