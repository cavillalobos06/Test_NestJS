import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class AssignSolicitudDto {
  @ApiProperty({
    example: 'asesor02',
    description: 'Identificador del usuario que tiene el rol asesor',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  asesorId: string;
}