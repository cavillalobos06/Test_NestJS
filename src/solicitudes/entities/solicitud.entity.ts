// Ruta: src/solicitudes/entities/solicitud.entity.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

// Enumeración que define el ciclo de vida y los estados de una solicitud comercial
export enum EstadoSolicitud {
  PENDIENTE = 'PENDIENTE',
  EN_GESTION = 'EN_GESTION',
  RESUELTA = 'RESUELTA',
}

// Entidad TypeORM que representa la tabla 'solicitudes' en la base de datos
@Entity('solicitudes')
export class SolicitudEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  cliente: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ name: 'asesor', type: 'varchar', length: 80, nullable: true })
  asesor: string | null;

  @Column({
    type: 'enum',
    enum: EstadoSolicitud,
    default: EstadoSolicitud.PENDIENTE,
  })
  estado: EstadoSolicitud;

  @CreateDateColumn({ type: 'timestamp' })
  creadaEn: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  actualizadaEn: Date;

  @VersionColumn()
  version: number;
}
