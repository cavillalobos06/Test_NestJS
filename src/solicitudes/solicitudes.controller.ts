import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';

import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiHeader,
} from '@nestjs/swagger';

import { Request } from 'express';

import { AppUser } from '../auth/auth.service.js';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guard/auth.guard.js';

import { SolicitudesService } from './solicitudes.service.js';
import { CreateSolicitudDto } from './dto/create-solicitud.dto.js';
import { UpdateEstadoDto } from './dto/update-estado.dto.js';
import { AssignSolicitudDto } from './dto/assign-solicitud.dto.js';
import { QuerySolicitudesDto } from './dto/query-solicitudes.dto.js';

interface AuthenticatedRequest extends Request {
  user: AppUser;
}

@ApiTags('Solicitudes')
@ApiHeader({
  name: 'x-api-key',
  required: true,
  description: 'Una de las claves configuradas en API_KEYS',
})
@ApiHeader({
  name: 'x-user',
  required: true,
  description: 'admin01, supervisor01, asesor01 o asesor02',
})
@UseGuards(AuthGuard)
@Controller('solicitudes')
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  // POST /solicitudes
  @Post()
  @ApiOperation({ summary: 'Crear una solicitud' })
  @ApiBody({ type: CreateSolicitudDto })
  async create(
    @Body() dto: CreateSolicitudDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const usuario = this.getUsuario(request);
    return this.solicitudesService.create(dto, usuario);
  }

  // GET /solicitudes
  @Get()
  @ApiOperation({
    summary: 'Listar solicitudes con filtros y paginación',
  })
  async findAll(
    @Query() filtros: QuerySolicitudesDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const usuario = this.getUsuario(request);
    return this.solicitudesService.findAll(usuario, filtros);
  }

  // GET /solicitudes/:id/historial
  // Debe declararse antes de GET /:id para mayor claridad.
  @Get(':id/historial')
  @ApiOperation({
    summary: 'Consultar el historial de una solicitud',
  })
  @ApiParam({ name: 'id', type: Number })
  async findHistory(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    const usuario = this.getUsuario(request);

    if (!['admin', 'supervisor', 'asesor'].includes(usuario.rol)) {
      throw new ForbiddenException(
        'No tienes permiso para consultar el historial',
      );
    }

    return this.solicitudesService.findHistory(id, usuario);
  }

  // PATCH /solicitudes/:id/asignacion
  @Patch(':id/asignacion')
  @ApiOperation({
    summary: 'Asignar o reasignar un asesor',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: AssignSolicitudDto })
  async assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignSolicitudDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const usuario = this.getUsuario(request);

    if (!['admin', 'supervisor'].includes(usuario.rol)) {
      throw new ForbiddenException(
        'Solo admin y supervisor pueden asignar asesores',
      );
    }

    return this.solicitudesService.assign(id, dto, usuario);
  }

  // PATCH /solicitudes/:id/estado
  @Patch(':id/estado')
  @ApiOperation({
    summary: 'Actualizar el estado de una solicitud',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateEstadoDto })
  async updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstadoDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const usuario = this.getUsuario(request);
    return this.solicitudesService.updateEstado(id, dto, usuario);
  }

  // GET /solicitudes/:id
  @Get(':id')
  @ApiOperation({ summary: 'Consultar una solicitud por ID' })
  @ApiParam({ name: 'id', type: Number })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    const usuario = this.getUsuario(request);
    return this.solicitudesService.findOne(id, usuario);
  }

  // Recupera el usuario que la autenticación añadió a la petición.
  private getUsuario(request: AuthenticatedRequest): AppUser {
    if (!request.user) {
      throw new ForbiddenException(
        'No se encontró el usuario autenticado en la petición',
      );
    }

    return request.user;
  }
}
