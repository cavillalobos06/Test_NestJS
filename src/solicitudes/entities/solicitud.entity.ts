import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Relation,
} from 'typeorm';

import { SolicitudHistorial } from './solicitud-historial.entity.js';

export enum EstadoSolicitud {
  PENDIENTE = 'PENDIENTE',
  EN_GESTION = 'EN_GESTION',
  RESUELTA = 'RESUELTA',
}

@Entity({ name: 'solicitudes' })
@Index('idx_solicitudes_estado', ['estado'])
@Index('idx_solicitudes_asesor', ['asesor'])
@Index('idx_solicitudes_creada_en', ['creadaEn'])
export class Solicitud {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 150,
  })
  cliente: string;

  @Column({
    type: 'text',
  })
  descripcion: string;

  @Column({
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  asesor: string | null;

  @Column({
    type: 'enum',
    enum: EstadoSolicitud,
    default: EstadoSolicitud.PENDIENTE,
  })
  estado: EstadoSolicitud;

  @CreateDateColumn({
    name: 'creada_en',
    type: 'timestamptz',
  })
  creadaEn: Date;

  @UpdateDateColumn({
    name: 'actualizada_en',
    type: 'timestamptz',
  })
  actualizadaEn: Date;

  @OneToMany(() => SolicitudHistorial, (historial) => historial.solicitud)
  historial: Relation<SolicitudHistorial[]>;
}
