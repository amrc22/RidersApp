# RidersApp Mini Sistema

Stack:
- Frontend: Vue 3 + Vite
- Backend: NestJS + TypeScript + Prisma
- Base de datos: PostgreSQL
- Infraestructura: Docker Compose

## Requisitos implementados

- Tabla de riders con nombre, zona, categoria, entregas completadas en ultimos 30 dias y rating promedio.
- Filtros por zona y categoria.
- Modal de evaluacion con categoria actual, categoria sugerida, comisiones y detalle del periodo.
- Modal para registrar una nueva entrega.
- API REST para riders, evaluacion, entregas y resumen por zona.
- Reglas de negocio para transiciones de estado y registro de calificacion.
- Carga automatica del `seed.json` al levantar contenedores.

## Levantar el proyecto

```bash
docker compose up --build
```

Tambien puede usarse:

```bash
docker-compose up --build
```

Una vez levantado el stack, accede a:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api`
- PostgreSQL: `localhost:5432`

## Endpoints principales

- `GET /riders`
- `GET /riders/:id`
- `GET /riders/:id/evaluation`
- `POST /deliveries`
- `PATCH /deliveries/:id/status`
- `GET /summary/zones`

## Regla de categoria aplicada

La evaluacion calcula la categoria sugerida segun entregas completadas y rating promedio de los ultimos 30 dias.  
La comision del endpoint de evaluacion y del resumen se calcula usando la categoria actual almacenada del rider.
