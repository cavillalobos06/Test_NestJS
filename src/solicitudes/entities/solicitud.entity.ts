// Ruta: src/solicitudes/entities/solicitud.entity.ts

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

// Enumeración que define el ciclo de vida y los estados de una solicitud comercial
export enum EstadoSolicitud {
    PENDIENTE = "PENDIENTE",
    EN_GESTION = "EN_GESTION",
    RESUELTA = "RESUELTA"
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

  @Column({ type: 'varchar', length: 100 })
  asesor: string;

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
}
