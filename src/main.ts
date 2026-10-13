// Ruta: src/main.ts

import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';

// Función principal de inicio: inicializa y configura el servidor NestJS
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita CORS para permitir peticiones desde otros orígenes
  app.enableCors();
  app.setGlobalPrefix('');

  // Validación global de DTOs: descarta propiedades no permitidas y transforma tipos
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Interceptor global para estandarizar el formato de respuestas exitosas
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Filtro global para capturar y dar formato uniforme a las excepciones HTTP
  app.useGlobalFilters(new HttpExceptionFilter());

  // Configuración y generación de la documentación interactiva con Swagger/OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Gestor Solicitudes Con NestJS')
    .setDescription(
      'API para registrar, consultar y gestionar solicitudes',
    )
    .setVersion('1.0.0')
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
    .addApiKey({ type: 'apiKey', name: 'x-user', in: 'header' }, 'x-user')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  // Inicio de la escucha en el puerto configurado
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`API disponible en http://localhost:${port}`);
  console.log(`Swagger disponible en http://localhost:${port}/docs`);
}
bootstrap();
