import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation
} from 'typeorm';

import { Solicitud } from './solicitud.entity.js';

export enum TipoEventoHistorial {
  CREACION = 'CREACION',
  ASIGNACION = 'ASIGNACION',
  ESTADO = 'ESTADO',
}

@Entity({ name: 'solicitudes_historial' })
@Index(
  'idx_historial_solicitud_fecha',
  ['solicitudId', 'fechaEvento'],
)
export class SolicitudHistorial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'solicitud_id',
    type: 'integer',
  })
  solicitudId: number;

  @ManyToOne(
    () => Solicitud,
    (solicitud) => solicitud.historial,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'solicitud_id' })
  solicitud: Relation<Solicitud>;

  @Column({
    type: 'enum',
    enum: TipoEventoHistorial,
  })
  tipoEvento: TipoEventoHistorial;

  @Column({
    type: 'text',
    nullable: true,
  })
  valorAnterior: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  valorNuevo: string | null;

  @Column({
    type: 'varchar',
    length: 80,
  })
  usuarioActor: string;

  @CreateDateColumn({
    name: 'fecha_evento',
    type: 'timestamptz',
  })
  fechaEvento: Date;
}