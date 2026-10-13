import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SolicitudEntity } from './solicitud.entity.js';

export enum EventoHistorial {
  CREACION = 'CREACION',
  ESTADO = 'ESTADO',
  ASIGNACION = 'ASIGNACION',
}

@Entity({ name: 'solicitudes_historial' })
@Index('IDX_historial_solicitud', ['solicitud'])
export class SolicitudHistorial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'solicitud_id', type: 'integer' })
  solicitud_id: number;

  @ManyToOne(() => SolicitudEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'solicitud_id' })
  solicitud: SolicitudEntity;

  @Column({
    name: 'tipo_evento',
    type: 'enum',
    enum: EventoHistorial,
    enumName: 'solicitudes_historial_tipo_enum',
  })
  tipoEvento: EventoHistorial;

  @Column({ name: 'valor_anterior', type: 'text', nullable: true })
  valorAnterior: string | null;

  @Column({ name: 'valor_nuevo', type: 'text' })
  valorNuevo: string;

  @Column({ name: 'usuario_actor', type: 'varchar', length: 80 })
  usuario_actor: string;

  @CreateDateColumn({ name: 'fecha_evento', type: 'timestamptz' })
  fechaEvento: Date;
}
