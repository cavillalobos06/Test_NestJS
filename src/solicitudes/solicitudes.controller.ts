import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AppUser } from '../auth/auth.service.js';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

import { ApiKeyGuard } from '../common/guards/api-key/api-key.guard.js';
import { RolesGuard } from '../common/guards/roles/roles.guard.js';
import { UserGuard } from '../common/guards/user/user.guard.js';

import { CreateSolicitudDto } from './dto/create-solicitud.dto.js';
import { UpdateEstadoDto } from './dto/update-estado.dto.js';
import { AssingSolicitudDto } from './dto/asignacion-solicitud.dto.js';
import { QuerySolicitudesDto } from './dto/query-solicitudes.dto.js';

import { SolicitudesService } from './solicitudes.service.js';

@ApiTags('Solicitudes')
@ApiHeader({
  name: 'x-api-key',
  required: true,
  description: 'Clave configurada en API_KEYS',
})
@ApiHeader({
  name: 'x-user',
  required: true,
  description: 'admin01, supervisor01, asesor01 o asesor02',
})
@ApiUnauthorizedResponse({ description: 'Falta una clave o identidad válida' })
@ApiBadRequestResponse({ description: 'Datos de entrada inválidos' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes' })
@ApiNotFoundResponse({ description: 'Solicitud inexistente o inaccesible' })
@Controller('solicitudes')
@UseGuards(ApiKeyGuard, UserGuard, RolesGuard)
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una solicitud comercial' })
  create(@Body() dto: CreateSolicitudDto, @CurrentUser() user: AppUser) {
    return this.solicitudesService.create(dto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'Consultar solicitudes con filtros y paginación',
  })
  findAll(@Query() filtros: QuerySolicitudesDto, @CurrentUser() user: AppUser) {
    return this.solicitudesService.findAll(user, filtros);
  }

  @Get(':id/historial')
  @ApiOperation({
    summary: 'Consultar el historial de auditoría de una solicitud',
  })
  @ApiParam({ name: 'id', type: Number })
  findHistorial(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AppUser,
  ) {
    return this.solicitudesService.findHistorial(id, user);
  }

  @Patch(':id/asignacion')
  @Roles('admin', 'supervisor')
  @ApiOperation({
    summary: 'Asignar o reasignar una solicitud a un asesor',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiConflictResponse({
    description: 'No se puede reasignar una solicitud resuelta',
  })
  asignar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssingSolicitudDto,
    @CurrentUser() user: AppUser,
  ) {
    return this.solicitudesService.asignar(id, dto, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar el detalle de una solicitud' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AppUser) {
    return this.solicitudesService.findOne(id, user);
  }

  @Patch(':id/estado')
  @Roles('admin', 'supervisor')
  @ApiOperation({
    summary: 'Cambiar el estado con control de versión',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiConflictResponse({
    description: 'Conflicto de versión o de negocio',
  })
  updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstadoDto,
    @CurrentUser() user: AppUser,
  ) {
    return this.solicitudesService.updateEstado(id, dto, user);
  }
}
