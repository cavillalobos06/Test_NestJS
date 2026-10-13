// Ruta: src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { SolicitudesModule } from './solicitudes/solicitudes.module.js';

// Módulo raíz de la aplicación: centraliza la configuración, la conexión a la base de datos y la importación de submódulos
@Module({
  imports: [
    // Variables de entorno disponibles en toda la aplicación
    ConfigModule.forRoot({ isGlobal: true }),
    // Configuración asíncrona de conexión a PostgreSQL mediante TypeORM
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '5432')),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    // Módulo encargado de autenticación, usuarios y roles
    AuthModule,
    // Módulo de lógica de negocio para gestionar solicitudes
    SolicitudesModule,
  ],
})
export class AppModule {}
