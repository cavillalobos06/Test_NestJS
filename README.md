# API de seguimiento de solicitudes comerciales

API REST construida con NestJS, TypeORM y PostgreSQL. Incluye autenticación sencilla mediante `x-api-key` y `x-user`, autorización por roles, validación de DTO, control de transiciones de estado, respuestas uniformes, filtro de excepciones y Swagger.

## Requisitos

- Node.js 20 o superior
- npm
- Docker Desktop (o Docker Engine) con Docker Compose

## 1. Preparar variables de entorno

Copia `.env.example` como `.env` y ajusta los valores si lo necesitas.

Linux/macOS:
```bash
cp .env.example .env
```

Windows PowerShell:
```powershell
Copy-Item .env.example .env
```

## 2. Levantar PostgreSQL

```bash
docker compose up -d
docker compose ps
```

Espera a que el contenedor esté saludable.

## 3. Instalar y ejecutar

```bash
npm install
npm run start:dev
```

La API queda disponible en `http://localhost:3000` y Swagger en `http://localhost:3000/docs`.

TypeORM tiene `synchronize: true` para facilitar la ejecución local de la prueba. **No se recomienda en producción**; en un proyecto real se deben usar migraciones.

## Autenticación de la prueba

Cada endpoint funcional requiere estas cabeceras:

- `x-api-key`: una de las claves separadas por coma en `API_KEYS`.
- `x-user`: identificador de un usuario configurado en `AuthService`.

Usuarios disponibles:

| Identificador | Rol |
|---|---|
| `admin01` | `admin` |
| `supervisor01` | `supervisor` |
| `asesor01` | `asesor` |
| `asesor02` | `asesor` |

Ejemplo de cabeceras:
```http
x-api-key: clave_prueba_1
x-user: asesor01
```

## Endpoints

Todos requieren ambas cabeceras.

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/solicitudes` | Crear solicitud |
| `GET` | `/solicitudes` | Listar solicitudes visibles para el usuario |
| `GET` | `/solicitudes/:id` | Consultar una solicitud |
| `PATCH` | `/solicitudes/:id/estado` | Cambiar el estado |

### Crear solicitud

```bash
curl -X POST http://localhost:3000/solicitudes \
  -H "Content-Type: application/json" \
  -H "x-api-key: clave_prueba_1" \
  -H "x-user: asesor01" \
  -d '{"cliente":"Comercial ABC","descripcion":"Solicita información sobre el portafolio","asesor":"asesor02"}'
```

La solicitud se crea siempre en `PENDIENTE`. Si el usuario autenticado es un asesor, el sistema asigna la solicitud a ese asesor e ignora el asesor enviado en el body.

### Listar solicitudes

```bash
curl http://localhost:3000/solicitudes \
  -H "x-api-key: clave_prueba_1" \
  -H "x-user: admin01"
```

Los asesores solo ven sus propias solicitudes. `admin` y `supervisor` pueden ver todas.

### Consultar una solicitud

```bash
curl http://localhost:3000/solicitudes/1 \
  -H "x-api-key: clave_prueba_1" \
  -H "x-user: asesor01"
```

### Cambiar estado

```bash
curl -X PATCH http://localhost:3000/solicitudes/1/estado \
  -H "Content-Type: application/json" \
  -H "x-api-key: clave_prueba_1" \
  -H "x-user: admin01" \
  -d '{"estado":"EN_GESTION"}'
```

Transiciones permitidas:
- `PENDIENTE` → `EN_GESTION`
- `EN_GESTION` → `RESUELTA`

No se permite saltar estados ni reabrir una solicitud resuelta. Solo `admin` y `supervisor` pueden cambiar estados.

## Respuestas

Éxito:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "cliente": "Comercial ABC",
    "descripcion": "Solicita información sobre el portafolio",
    "asesor": "asesor01",
    "estado": "PENDIENTE",
    "creadaEn": "2026-10-09T14:00:00.000Z",
    "actualizadaEn": "2026-10-09T14:00:00.000Z"
  }
}
```

Error (ejemplo):
```json
{
  "success": false,
  "statusCode": 403,
  "message": "No tienes permiso para consultar esta solicitud",
  "timestamp": "2026-10-09T14:00:00.000Z",
  "path": "/solicitudes/1"
}
```
## Estructura principal

```text
src/
  auth/
  common/
    decorators/
    filters/
    guards/
    interceptors/
  solicitudes/
    dto/
    entities/
```
