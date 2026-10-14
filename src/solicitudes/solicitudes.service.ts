
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InjectDataSource,
  InjectRepository,
} from '@nestjs/typeorm';
import {
  DataSource,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';

import { AppUser, AuthService } from '../auth/auth.service.js';
import { CreateSolicitudDto } from './dto/create-solicitud.dto.js';
import { UpdateEstadoDto } from './dto/update-estado.dto.js';
import { AssignSolicitudDto } from './dto/assign-solicitud.dto.js';
import { QuerySolicitudesDto } from './dto/query-solicitudes.dto.js';

import {
  EstadoSolicitud,
  Solicitud,
} from './entities/solicitud.entity.js';

import {
  SolicitudHistorial,
  TipoEventoHistorial,
} from './entities/solicitud-historial.entity.js';

@Injectable()
export class SolicitudesService {
  constructor(
    @InjectRepository(Solicitud)
    private readonly solicitudRepository: Repository<Solicitud>,

    @InjectRepository(SolicitudHistorial)
    private readonly historialRepository: Repository<SolicitudHistorial>,

    @InjectDataSource()
    private readonly dataSource: DataSource,

    private readonly authService: AuthService,
  ) {}

  // Crear solicitud y registrar evento inicial.
  async create(
    dto: CreateSolicitudDto,
    usuario: AppUser,
  ): Promise<Solicitud> {
    const cliente = dto.cliente.trim();
    const descripcion = dto.descripcion.trim();

    if (!cliente || !descripcion) {
      throw new BadRequestException(
        'El cliente y la descripción son obligatorios',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const solicitudRepo = manager.getRepository(Solicitud);
      const historialRepo = manager.getRepository(SolicitudHistorial);

      const solicitud = solicitudRepo.create({
        cliente,
        descripcion,
        asesor: usuario.rol === 'asesor' ? usuario.id : null,
        estado: EstadoSolicitud.PENDIENTE,
      });

      const guardada = await solicitudRepo.save(solicitud);

      await historialRepo.save({
        solicitudId: guardada.id,
        tipoEvento: TipoEventoHistorial.CREACION,
        valorAnterior: null,
        valorNuevo: EstadoSolicitud.PENDIENTE,
        usuarioActor: usuario.id,
      });

      return guardada;
    });
  }

  // Listar, filtrar y paginar solicitudes.
  async findAll(
    usuario: AppUser,
    filtros: QuerySolicitudesDto,
  ) {
    const page = filtros.page ?? 1;
    const limit = filtros.limit ?? 10;

    if (
      filtros.desde &&
      filtros.hasta &&
      new Date(filtros.desde) > new Date(filtros.hasta)
    ) {
      throw new BadRequestException(
        'La fecha desde no puede ser posterior a hasta',
      );
    }

    const qb = this.solicitudRepository
      .createQueryBuilder('solicitud');

    this.applyVisibility(qb, usuario);

    if (filtros.estado) {
      qb.andWhere('solicitud.estado = :estado', {
        estado: filtros.estado,
      });
    }

    if (filtros.asesor) {
      qb.andWhere('solicitud.asesor = :asesor', {
        asesor: filtros.asesor,
      });
    }

    if (filtros.cliente) {
      qb.andWhere('solicitud.cliente ILIKE :cliente', {
        cliente: `%${filtros.cliente.trim()}%`,
      });
    }

    if (filtros.desde) {
      qb.andWhere('solicitud.creadaEn >= :desde', {
        desde: new Date(filtros.desde),
      });
    }

    if (filtros.hasta) {
      // Incluye el día completo cuando se envía YYYY-MM-DD.
      const hasta = new Date(filtros.hasta);

      if (/^\d{4}-\d{2}-\d{2}$/.test(filtros.hasta)) {
        hasta.setUTCDate(hasta.getUTCDate() + 1);
        qb.andWhere('solicitud.creadaEn < :hasta', { hasta });
      } else {
        qb.andWhere('solicitud.creadaEn <= :hasta', { hasta });
      }
    }

    const [items, total] = await qb
      .orderBy('solicitud.creadaEn', 'DESC')
      .addOrderBy('solicitud.id', 'DESC')
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

  // Consultar una solicitud respetando los permisos del asesor.
  async findOne(
    id: number,
    usuario: AppUser,
  ): Promise<Solicitud> {
    const solicitud = await this.solicitudRepository.findOne({
      where: { id },
    });

    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    this.ensureAdvisorAccess(solicitud, usuario);

    return solicitud;
  }

  // Asignar o reasignar un asesor y registrar el cambio.
  async assign(
    id: number,
    dto: AssignSolicitudDto,
    usuario: AppUser,
  ): Promise<Solicitud> {
    const destino = this.authService.findUser(dto.asesorId);

    if (!destino || destino.rol !== 'asesor') {
      throw new BadRequestException(
        'El usuario destino debe existir y tener el rol asesor',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const solicitudRepo = manager.getRepository(Solicitud);
      const historialRepo = manager.getRepository(SolicitudHistorial);

      const solicitud = await solicitudRepo.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!solicitud) {
        throw new NotFoundException('Solicitud no encontrada');
      }

      if (solicitud.estado === EstadoSolicitud.RESUELTA) {
        throw new ConflictException(
          'No se puede reasignar una solicitud resuelta',
        );
      }

      const asesorAnterior = solicitud.asesor;

      solicitud.asesor = destino.id;
      const actualizada = await solicitudRepo.save(solicitud);

      await historialRepo.save({
        solicitudId: actualizada.id,
        tipoEvento: TipoEventoHistorial.ASIGNACION,
        valorAnterior: asesorAnterior,
        valorNuevo: destino.id,
        usuarioActor: usuario.id,
      });

      return actualizada;
    });
  }

  // Cambiar estado y registrar el evento dentro de una transacción.
  async updateEstado(
    id: number,
    dto: UpdateEstadoDto,
    usuario: AppUser,
  ): Promise<Solicitud> {
    return this.dataSource.transaction(async (manager) => {
      const solicitudRepo = manager.getRepository(Solicitud);
      const historialRepo = manager.getRepository(SolicitudHistorial);

      const solicitud = await solicitudRepo.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!solicitud) {
        throw new NotFoundException('Solicitud no encontrada');
      }

      this.ensureAdvisorAccess(solicitud, usuario);

      const transiciones: Record<
        EstadoSolicitud,
        EstadoSolicitud[]
      > = {
        [EstadoSolicitud.PENDIENTE]: [
          EstadoSolicitud.EN_GESTION,
        ],
        [EstadoSolicitud.EN_GESTION]: [
          EstadoSolicitud.RESUELTA,
        ],
        [EstadoSolicitud.RESUELTA]: [],
      };

      if (!transiciones[solicitud.estado].includes(dto.estado)) {
        throw new BadRequestException(
          `No se permite cambiar de ${solicitud.estado} a ${dto.estado}`,
        );
      }

      const estadoAnterior = solicitud.estado;
      solicitud.estado = dto.estado;

      const actualizada = await solicitudRepo.save(solicitud);

      await historialRepo.save({
        solicitudId: actualizada.id,
        tipoEvento: TipoEventoHistorial.ESTADO,
        valorAnterior: estadoAnterior,
        valorNuevo: actualizada.estado,
        usuarioActor: usuario.id,
      });

      return actualizada;
    });
  }

  // Consultar historial: asesor solo si tiene la solicitud asignada.
  async findHistory(
    id: number,
    usuario: AppUser,
  ): Promise<SolicitudHistorial[]> {
    const solicitud = await this.solicitudRepository.findOne({
      where: { id },
    });

    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    this.ensureAdvisorAccess(solicitud, usuario);

    return this.historialRepository.find({
      where: { solicitudId: id },
      order: {
        fechaEvento: 'ASC',
        id: 'ASC',
      },
    });
  }

  private applyVisibility(
    qb: SelectQueryBuilder<Solicitud>,
    usuario: AppUser,
  ): void {
    if (usuario.rol === 'asesor') {
      // Esta condición prevalece sobre cualquier filtro enviado.
      qb.andWhere('solicitud.asesor = :asesorActual', {
        asesorActual: usuario.id,
      });
    }
  }

  private ensureAdvisorAccess(
    solicitud: Solicitud,
    usuario: AppUser,
  ): void {
    if (
      usuario.rol === 'asesor' &&
      solicitud.asesor !== usuario.id
    ) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a esta solicitud',
      );
    }
  }
}
