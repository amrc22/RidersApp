import { PrismaClient, Prisma } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

type SeedCategory = {
  nombre: string;
  entregas_minimas: number;
  calificacion_minima: number;
  comision_porcentaje: number;
};

type SeedRider = {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  zona: string;
  categoria: string;
  fecha_ingreso: string;
};

type SeedDelivery = {
  rider_id: number;
  descripcion: string;
  valor: number;
  estado: 'pendiente' | 'en_curso' | 'completada' | 'cancelada';
  calificacion: number | null;
  fecha_creacion: string;
};

type SeedFile = {
  categorias: SeedCategory[];
  riders: SeedRider[];
  entregas: SeedDelivery[];
};

const prisma = new PrismaClient();

async function main() {
  const seedPath = join(__dirname, '..', '..', 'seed.json');
  const raw = readFileSync(seedPath, 'utf8');
  const data = JSON.parse(raw) as SeedFile;

  const existingData = await prisma.category.count();
  if (existingData > 0) {
    console.log('Seed omitido: la base ya contiene datos.');
    return;
  }

  await prisma.delivery.deleteMany();
  await prisma.rider.deleteMany();
  await prisma.category.deleteMany();

  for (const [index, category] of data.categorias.entries()) {
    await prisma.category.create({
      data: {
        name: category.nombre,
        rank: index + 1,
        minDeliveries: category.entregas_minimas,
        minRating: new Prisma.Decimal(category.calificacion_minima),
        commissionPct: new Prisma.Decimal(category.comision_porcentaje),
      },
    });
  }

  const categories = await prisma.category.findMany();
  const categoryMap = new Map(categories.map((category) => [category.name, category.id]));

  for (const rider of data.riders) {
    await prisma.rider.create({
      data: {
        id: rider.id,
        name: rider.nombre,
        email: rider.email,
        phone: rider.telefono,
        zone: rider.zona,
        joinedAt: new Date(rider.fecha_ingreso),
        categoryId: categoryMap.get(rider.categoria)!,
      },
    });
  }

  for (const delivery of data.entregas) {
    const createdAt = new Date(delivery.fecha_creacion);
    await prisma.delivery.create({
      data: {
        riderId: delivery.rider_id,
        description: delivery.descripcion,
        amount: new Prisma.Decimal(delivery.valor),
        status: delivery.estado,
        customerRating:
          delivery.calificacion === null ? null : new Prisma.Decimal(delivery.calificacion),
        createdAt,
        completedAt: delivery.estado === 'completada' ? createdAt : null,
        canceledAt: delivery.estado === 'cancelada' ? createdAt : null,
      },
    });
  }
}

main()
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
