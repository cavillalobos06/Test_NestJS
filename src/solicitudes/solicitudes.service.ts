// Ruta: src/solicitudes/solicitudes.service.ts

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppUser } from '../auth/auth.service.js';
import { EstadoSolicitud, SolicitudEntity } from './entities/solicitud.entity.js';
import { CreateSolicitudDto } from './dto/create-solicitud.dto.js';
import { UpdateEstadoDto } from './dto/update-estado.dto.js';

// Servicio que implementa la lógica de negocio y operaciones de base de datos para solicitudes
@Injectable()
export class SolicitudesService {
  constructor(
    @InjectRepository(SolicitudEntity)
    private readonly solicitudRepository: Repository<SolicitudEntity>,
  ) {}

  // Crea una nueva solicitud en estado PENDIENTE; si el usuario es asesor, se le asigna automáticamente
  async create(
    dto: CreateSolicitudDto,
    usuario: AppUser,
  ): Promise<SolicitudEntity> {
    const asesor = usuario.rol === 'asesor' ? usuario.id : dto.asesor.trim();

    const solicitud = this.solicitudRepository.create({
      cliente: dto.cliente.trim(),
      descripcion: dto.descripcion.trim(),
      asesor,
      estado: EstadoSolicitud.PENDIENTE,
    });

    return this.solicitudRepository.save(solicitud);
  }

  // Retorna todas las solicitudes si es admin/supervisor, o solo las propias si es asesor
  async findAll(usuario: AppUser): Promise<SolicitudEntity[]> {
    if (usuario.rol === 'asesor') {
      return this.solicitudRepository.find({
        where: { asesor: usuario.id },
        order: { creadaEn: 'DESC' },
      });
    }

    return this.solicitudRepository.find({
      order: { creadaEn: 'DESC' },
    });
  }

  // Busca una solicitud por ID asegurando que los asesores solo vean sus propias solicitudes
  async findOne(id: number, usuario: AppUser): Promise<SolicitudEntity> {
    const solicitud = await this.solicitudRepository.findOne({
      where: { id },
    });

    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (usuario.rol === 'asesor' && solicitud.asesor !== usuario.id) {
      throw new ForbiddenException(
        'No tienes permiso para consultar esta solicitud',
      );
    }

    return solicitud;
  }

  // Modifica el estado de una solicitud validando transiciones permitidas según el flujo definido
  async updateEstado(
    id: number,
    dto: UpdateEstadoDto,
    usuario: AppUser,
  ): Promise<SolicitudEntity> {
    const solicitud = await this.solicitudRepository.findOne({
      where: { id },
    });

    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (usuario.rol === 'asesor' && solicitud.asesor !== usuario.id) {
      throw new ForbiddenException(
        'No puedes modificar solicitudes de otros asesores',
      );
    }

    const transicionesPermitidas: Record<EstadoSolicitud, EstadoSolicitud[]> = {
      [EstadoSolicitud.PENDIENTE]: [EstadoSolicitud.EN_GESTION],
      [EstadoSolicitud.EN_GESTION]: [EstadoSolicitud.RESUELTA],
      [EstadoSolicitud.RESUELTA]: [],
    };

    const permitidos = transicionesPermitidas[solicitud.estado];

    if (!permitidos.includes(dto.estado)) {
      throw new BadRequestException(
        `No se permite cambiar de ${solicitud.estado} a ${dto.estado}`,
      );
    }

    solicitud.estado = dto.estado;

    return this.solicitudRepository.save(solicitud);
  }
}
