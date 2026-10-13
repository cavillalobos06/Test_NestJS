// Ruta: src/solicitudes/solicitudes.controller.ts

import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AppUser } from '../auth/auth.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { ApiKeyGuard } from '../common/guards/api-key/api-key.guard.js';
import { RolesGuard } from '../common/guards/roles/roles.guard.js';
import { UserGuard } from '../common/guards/user/user.guard.js';
import { CreateSolicitudDto } from './dto/create-solicitud.dto.js';
import { UpdateEstadoDto } from './dto/update-estado.dto.js';
import { SolicitudesService } from './solicitudes.service.js';

// Controlador HTTP que expone y gestiona las rutas del módulo de solicitudes
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
@Controller('solicitudes')
@UseGuards(ApiKeyGuard, UserGuard, RolesGuard)
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  // Endpoint POST /solicitudes: crea una nueva solicitud comercial
  @Post()
  @ApiOperation({ summary: 'Crear una solicitud comercial' })
  create(@Body() dto: CreateSolicitudDto, @CurrentUser() user: AppUser) {
    return this.solicitudesService.create(dto, user);
  }

  // Endpoint GET /solicitudes: lista todas las solicitudes visibles según el rol del usuario
  @Get()
  @ApiOperation({
    summary: 'Listar solicitudes visibles para el usuario actual',
  })
  findAll(@CurrentUser() user: AppUser) {
    return this.solicitudesService.findAll(user);
  }

  // Endpoint GET /solicitudes/:id: consulta una solicitud por su ID validando permisos
  @Get(':id')
  @ApiOperation({ summary: 'Consultar una solicitud por id' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AppUser) {
    return this.solicitudesService.findOne(id, user);
  }

  // Endpoint PATCH /solicitudes/:id/estado: cambia el estado de la solicitud (solo admin y supervisor)
  @Patch(':id/estado')
  @Roles('admin', 'supervisor')
  @ApiOperation({
    summary: 'Cambiar el estado siguiendo las transiciones permitidas',
  })
  @ApiParam({ name: 'id', type: Number })
  updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstadoDto,
    @CurrentUser() user: AppUser,
  ) {
    return this.solicitudesService.updateEstado(id, dto, user);
  }
}
