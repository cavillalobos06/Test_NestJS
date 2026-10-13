import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { DataSource, Repository } from 'typeorm';

import { AuthService, AppUser } from '../auth/auth.service.js';

import { CreateSolicitudDto } from './dto/create-solicitud.dto.js';
import { UpdateEstadoDto } from './dto/update-estado.dto.js';
import { AssingSolicitudDto } from './dto/asignacion-solicitud.dto.js';
import { QuerySolicitudesDto } from './dto/query-solicitudes.dto.js';

import {
  EstadoSolicitud,
  SolicitudEntity,
} from './entities/solicitud.entity.js';

import {
  SolicitudHistorial,
  EventoHistorial,
} from './entities/solicitud-historial.entity.js';

@Injectable()
export class SolicitudesService {
  constructor(
    @InjectRepository(SolicitudEntity)
    private readonly solicitudesRepository: Repository<SolicitudEntity>,

    @InjectRepository(SolicitudHistorial)
    private readonly historialRepository: Repository<SolicitudHistorial>,

    private readonly dataSource: DataSource,

    private readonly authService: AuthService,
  ) {}

  async create(
    dto: CreateSolicitudDto,
    user: AppUser,
  ): Promise<SolicitudEntity> {
    return this.dataSource.transaction(async (manager) => {
      const asesor = user.rol === 'asesor' ? user.id : null;

      const solicitud = manager.create(SolicitudEntity, {
        cliente: dto.cliente,
        descripcion: dto.descripcion,
        asesor,
        estado: EstadoSolicitud.PENDIENTE,
      });

      const guardada = await manager.save(SolicitudEntity, solicitud);

      const evento = manager.create(SolicitudHistorial, {
        solicitudId: guardada.id,
        tipoEvento: EventoHistorial.CREACION,
        valorAnterior: null,
        valorNuevo: EstadoSolicitud.PENDIENTE,
        usuarioActor: user.id,
      });

      await manager.save(SolicitudHistorial, evento);

      return guardada;
    });
  }

  async findAll(user: AppUser, filtros: QuerySolicitudesDto) {
    if (
      filtros.desde &&
      filtros.hasta &&
      new Date(filtros.desde) > new Date(filtros.hasta)
    ) {
      throw new BadRequestException(
        'La fecha desde no puede ser posterior a la fecha hasta',
      );
    }

    const query = this.solicitudesRepository.createQueryBuilder('solicitud');

    if (user.rol === 'asesor') {
      query.andWhere('solicitud.asesor = :usuarioId', { usuarioId: user.id });
    }

    if (filtros.estado) {
      query.andWhere('solicitud.estado = :estado', { estado: filtros.estado });
    }

    if (filtros.asesor && user.rol !== 'asesor') {
      query.andWhere('solicitud.asesor = :asesor', { asesor: filtros.asesor });
    }

    if (filtros.cliente) {
      query.andWhere('solicitud.cliente ILIKE :cliente', {
        cliente: `%${filtros.cliente}%`,
      });
    }

    if (filtros.desde) {
      query.andWhere('solicitud.creadaEn >= :desde', {
        desde: new Date(filtros.desde),
      });
    }

    if (filtros.hasta) {
      query.andWhere('solicitud.creadaEn <= :hasta', {
        hasta: new Date(filtros.hasta),
      });
    }

    const page = filtros.page ?? 1;
    const limit = filtros.limit ?? 10;

    const [items, total] = await query
      .orderBy('solicitud.creadaEn', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, user: AppUser): Promise<SolicitudEntity> {
    const query = this.solicitudesRepository
      .createQueryBuilder('solicitud')
      .where('solicitud.id = :id', { id });

    if (user.rol === 'asesor') {
      query.andWhere('solicitud.asesor = :usuarioId', { usuarioId: user.id });
    }

    const solicitud = await query.getOne();

    if (!solicitud) {
      if (user.rol === 'asesor') {
        throw new NotFoundException(
          'La solicitud no existe o no tienes acceso a ella',
        );
      }

      throw new NotFoundException(`No existe una solicitud con id ${id}`);
    }

    return solicitud;
  }

  async asignar(
    id: number,
    dto: AssingSolicitudDto,
    user: AppUser,
  ): Promise<SolicitudEntity> {
    this.validarRolGestion(user);

    const asesorDestino = this.authService.findUser(dto.asesorId);

    if (!asesorDestino || asesorDestino.rol !== 'asesor') {
      throw new BadRequestException(
        'El usuario asignado debe existir y tener el rol asesor',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(SolicitudEntity);
      const historial = manager.getRepository(SolicitudHistorial);

      const solicitud = await repository
        .createQueryBuilder('solicitud')
        .setLock('pessimistic_write')
        .where('solicitud.id = :id', { id })
        .getOne();

      if (!solicitud) {
        throw new NotFoundException(`No existe una solicitud con id ${id}`);
      }

      if (solicitud.estado === EstadoSolicitud.RESUELTA) {
        throw new ConflictException(
          'No se puede reasignar una solicitud resuelta',
        );
      }

      const asesorAnterior = solicitud.asesor;

      solicitud.asesor = asesorDestino.id;

      await repository.save(solicitud);

      const evento = historial.create({
        solicitud_id: solicitud.id,
        tipoEvento: EventoHistorial.ASIGNACION,
        valorAnterior: asesorAnterior,
        valorNuevo: asesorDestino.id,
        usuario_actor: user.id,
      });

      await historial.save(evento);

      return solicitud;
    });
  }

  async updateEstado(
    id: number,
    dto: UpdateEstadoDto,
    user: AppUser,
  ): Promise<SolicitudEntity> {
    this.validarRolGestion(user);

    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(SolicitudEntity);
      const historial = manager.getRepository(SolicitudHistorial);

      const solicitud = await repository
        .createQueryBuilder('solicitud')
        .setLock('pessimistic_write')
        .where('solicitud.id = :id', { id })
        .getOne();

      if (!solicitud) {
        throw new NotFoundException(`No existe una solicitud con id ${id}`);
      }

      if (solicitud.version !== dto.versionEsperada) {
        throw new ConflictException(
          'La solicitud fue modificada por otro usuario. Consulta la versión actual.',
        );
      }

      const transicionesPermitidas: Record<EstadoSolicitud, EstadoSolicitud[]> =
        {
          [EstadoSolicitud.PENDIENTE]: [EstadoSolicitud.EN_GESTION],
          [EstadoSolicitud.EN_GESTION]: [EstadoSolicitud.RESUELTA],
          [EstadoSolicitud.RESUELTA]: [],
        };

      const permitidos = transicionesPermitidas[solicitud.estado];

      if (!permitidos.includes(dto.estado)) {
        throw new BadRequestException(
          `Transición no permitida: ${solicitud.estado} -> ${dto.estado}`,
        );
      }

      const estadoAnterior = solicitud.estado;
      const versionAnterior = solicitud.version;

      const resultado = await repository
        .createQueryBuilder()
        .update(SolicitudEntity)
        .set({
          estado: dto.estado,
          version: () => '"version" + 1',
          actualizadaEn: () => 'CURRENT_TIMESTAMP',
        })
        .where('id = :id', { id })
        .andWhere('version = :version', {
          version: dto.versionEsperada,
        })
        .execute();

      if (resultado.affected !== 1) {
        throw new ConflictException(
          'La solicitud fue modificada por otro usuario. Consulta la versión actual.',
        );
      }

      const evento = historial.create({
        solicitud_id: id,
        tipoEvento: EventoHistorial.ESTADO,
        valorAnterior: estadoAnterior,
        valorNuevo: dto.estado,
        usuario_actor: user.id,
      });

      await historial.save(evento);

      const actualizada = await repository.findOne({
        where: { id },
      });

      if (!actualizada) {
        throw new NotFoundException(`No existe una solicitud con id ${id}`);
      }

      return actualizada;
    });
  }

  async findHistorial(
    id: number,
    user: AppUser,
  ): Promise<SolicitudHistorial[]> {
    await this.findOne(id, user);

    return this.historialRepository.find({
      where: { solicitud_id: id },
      order: { fechaEvento: 'ASC' },
    });
  }

  private validarRolGestion(user: AppUser): void {
    if (user.rol !== 'admin' && user.rol !== 'supervisor') {
      throw new ForbiddenException(
        'No tienes permisos para realizar esta operación',
      );
    }
  }
}
