import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListRidersQueryDto } from './dto/list-riders-query.dto';
import { getLast30DaysWindow } from '../common/date.util';
import { round, toNumber } from '../common/decimal.util';
import { Category } from '@prisma/client';
import { CreateRiderDto } from './dto/create-rider.dto';

@Injectable()
export class RidersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRiderDto) {
    const existingRider = await this.prisma.rider.findUnique({
      where: { email: dto.email },
    });

    if (existingRider) {
      throw new BadRequestException('Ya existe un rider con ese correo');
    }

    const category = await this.prisma.category.findUnique({
      where: { name: 'Rookie' },
    });

    if (!category) {
      throw new BadRequestException('La categoria Rookie no existe');
    }

    const maxRider = await this.prisma.rider.aggregate({
      _max: { id: true },
    });

    const rider = await this.prisma.rider.create({
      data: {
        id: (maxRider._max.id ?? 0) + 1,
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone.trim(),
        zone: dto.zone.trim(),
        joinedAt: new Date(),
        categoryId: category.id,
      },
      include: {
        category: true,
      },
    });

    return {
      id: rider.id,
      name: rider.name,
      email: rider.email,
      phone: rider.phone,
      zone: rider.zone,
      joinedAt: rider.joinedAt,
      currentCategory: this.mapCategory(rider.category),
      latestDelivery: null,
      completedDeliveriesLast30Days: 0,
      averageRatingLast30Days: null,
    };
  }

  async list(query: ListRidersQueryDto) {
    const { startDate, endDate } = getLast30DaysWindow();
    const riders = await this.prisma.rider.findMany({
      where: {
        zone: query.zone || undefined,
        category: query.category ? { name: query.category } : undefined,
      },
      include: {
        category: true,
        deliveries: {
          where: {
            status: 'completada',
            completedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
      orderBy: [{ zone: 'asc' }, { name: 'asc' }],
    });

    const latestDeliveries = await Promise.all(
      riders.map((rider) =>
        this.prisma.delivery.findFirst({
          where: { riderId: rider.id },
          orderBy: { createdAt: 'desc' },
        }),
      ),
    );

    const mappedRiders = riders.map((rider, index) => {
      const completedDeliveries = rider.deliveries.length;
      const averageRating =
        completedDeliveries === 0
          ? null
          : round(
              rider.deliveries.reduce((sum, delivery) => sum + toNumber(delivery.customerRating)!, 0) /
                completedDeliveries,
            );
      const latestDelivery = latestDeliveries[index];

      return {
        id: rider.id,
        name: rider.name,
        email: rider.email,
        phone: rider.phone,
        zone: rider.zone,
        joinedAt: rider.joinedAt,
        currentCategory: this.mapCategory(rider.category),
        latestDelivery:
          latestDelivery === null
            ? null
            : {
                id: latestDelivery.id,
                description: latestDelivery.description,
                status: latestDelivery.status,
                createdAt: latestDelivery.createdAt,
              },
        completedDeliveriesLast30Days: completedDeliveries,
        averageRatingLast30Days: averageRating,
      };
    });

    if (!query.status) {
      return mappedRiders;
    }

    return mappedRiders.filter((rider) => rider.latestDelivery?.status === query.status);
  }

  async findOne(id: number) {
    const rider = await this.prisma.rider.findUnique({
      where: { id },
      include: {
        category: true,
        deliveries: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!rider) {
      throw new NotFoundException('Rider no encontrado');
    }

    return {
      id: rider.id,
      name: rider.name,
      email: rider.email,
      phone: rider.phone,
      zone: rider.zone,
      joinedAt: rider.joinedAt,
      currentCategory: this.mapCategory(rider.category),
      recentDeliveries: rider.deliveries.map((delivery) => ({
        id: delivery.id,
        description: delivery.description,
        amount: toNumber(delivery.amount),
        status: delivery.status,
        customerRating: toNumber(delivery.customerRating),
        createdAt: delivery.createdAt,
        completedAt: delivery.completedAt,
      })),
    };
  }

  async evaluate(id: number) {
    const rider = await this.prisma.rider.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!rider) {
      throw new NotFoundException('Rider no encontrado');
    }

    const completedDeliveries = await this.getCompletedDeliveriesLast30Days(id);
    const categories = await this.prisma.category.findMany({
      orderBy: { rank: 'asc' },
    });

    const averageRating =
      completedDeliveries.length === 0
        ? null
        : round(
            completedDeliveries.reduce((sum, delivery) => sum + toNumber(delivery.customerRating)!, 0) /
              completedDeliveries.length,
          );

    const suggestedCategory = this.getSuggestedCategory(
      categories,
      completedDeliveries.length,
      averageRating ?? 0,
    );

    const commissionRate = toNumber(rider.category.commissionPct)! / 100;
    const commissionsGenerated = round(
      completedDeliveries.reduce((sum, delivery) => sum + toNumber(delivery.amount)! * commissionRate, 0),
    );

    return {
      rider: {
        id: rider.id,
        name: rider.name,
        zone: rider.zone,
      },
      completedDeliveriesLast30Days: completedDeliveries.length,
      averageRatingLast30Days: averageRating,
      currentCategory: this.mapCategory(rider.category),
      suggestedCategory: this.mapCategory(suggestedCategory),
      commissionsGeneratedLast30Days: commissionsGenerated,
      completedDeliveries: completedDeliveries.map((delivery) => ({
        id: delivery.id,
        description: delivery.description,
        amount: toNumber(delivery.amount),
        customerRating: toNumber(delivery.customerRating),
        completedAt: delivery.completedAt,
      })),
    };
  }

  async getCompletedDeliveriesLast30Days(riderId: number) {
    const { startDate, endDate } = getLast30DaysWindow();
    return this.prisma.delivery.findMany({
      where: {
        riderId,
        status: 'completada',
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { completedAt: 'desc' },
    });
  }

  private getSuggestedCategory(categories: Category[], completedCount: number, averageRating: number) {
    const category = [...categories]
      .reverse()
      .find(
        (item) =>
          completedCount >= item.minDeliveries && averageRating >= toNumber(item.minRating)!,
      );

    return category ?? categories[0];
  }

  private mapCategory(category: Category) {
    return {
      id: category.id,
      name: category.name,
      rank: category.rank,
      minDeliveries: category.minDeliveries,
      minRating: toNumber(category.minRating),
      commissionPct: toNumber(category.commissionPct),
    };
  }
}
