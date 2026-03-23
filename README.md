# RidersApp

Sistema de gestion y evaluacion de repartidores. Permite visualizar riders, filtrarlos por zona y categoria, evaluar su rendimiento de los ultimos 30 dias y registrar nuevas entregas.

## Stack

| Capa | Tecnologia |
|------|------------|
| Frontend | Vue 3 + Vite + SweetAlert2 |
| Backend | NestJS 10 + TypeScript |
| ORM | Prisma 6 |
| Base de datos | PostgreSQL 16 |
| Infraestructura | Docker Compose |

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo

## Levantar el proyecto

Desde la carpeta `RidersApp/`:

```bash
docker compose up
```

Una vez levantado el stack:

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Swagger (docs) | http://localhost:3000/api |
| PostgreSQL | localhost:5432 |

> La base de datos se inicializa automaticamente con los datos del `seed.json` al levantar los contenedores.

## Funcionalidades

- Tabla de riders con nombre, zona, categoria, entregas completadas en los ultimos 30 dias y rating promedio
- Filtros por zona, categoria y estado de ultima entrega
- Modal de evaluacion: categoria actual, categoria sugerida, comisiones generadas y detalle de entregas del periodo
- Modal para registrar una nueva entrega a un rider
- Modal para crear un nuevo rider (inicia en categoria Rookie)
- Resumen estadistico por zona

## Endpoints de la API

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/riders` | Listar riders con filtros opcionales (`zone`, `category`, `status`) |
| `GET` | `/riders/:id` | Detalle de un rider con sus ultimas 20 entregas |
| `GET` | `/riders/:id/evaluation` | Evaluacion del rider (ultimos 30 dias) |
| `POST` | `/riders` | Crear un nuevo rider |
| `POST` | `/deliveries` | Registrar una nueva entrega |
| `PATCH` | `/deliveries/:id/status` | Actualizar estado de una entrega |
| `GET` | `/summary/zones` | Resumen agregado por zona |

## Logica de categorias

Las categorias disponibles son: **Rookie**, **Semi-Pro**, **Pro** y **Elite**.

La evaluacion calcula la categoria sugerida segun las entregas completadas y el rating promedio de los **ultimos 30 dias**. Se sugiere la categoria mas alta cuyo `minDeliveries` y `minRating` sean alcanzados.

La comision se calcula aplicando el porcentaje (`commissionPct`) de la categoria **actual** del rider sobre el monto de cada entrega completada en el periodo.

## Transiciones de estado de entregas

```
pendiente → en_curso → completada
                     → cancelada
```

Solo se puede registrar `customerRating` al completar una entrega.

## Modelo de datos

```
Category { id, name, rank, minDeliveries, minRating, commissionPct }
Rider     { id, name, email, phone, zone, joinedAt, categoryId }
Delivery  { id, riderId, description, amount, status, customerRating, createdAt, completedAt, canceledAt }
```
