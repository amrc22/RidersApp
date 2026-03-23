import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getLast30DaysWindow } from '../common/date.util';
import { round, toNumber } from '../common/decimal.util';

@Injectable()
export class SummaryService {
  constructor(private readonly prisma: PrismaService) {}

  async byZone() {
    const { startDate, endDate } = getLast30DaysWindow();
    const riders = await this.prisma.rider.findMany({
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
      orderBy: { zone: 'asc' },
    });

    const zonesMap = new Map<
      string,
      {
        zone: string;
        completedDeliveries: number;
        totalCommissions: number;
        ratings: number[];
        ridersPerCategory: Record<string, number>;
      }
    >();

    for (const rider of riders) {
      const zoneData = zonesMap.get(rider.zone) ?? {
        zone: rider.zone,
        completedDeliveries: 0,
        totalCommissions: 0,
        ratings: [],
        ridersPerCategory: {},
      };

      zoneData.ridersPerCategory[rider.category.name] =
        (zoneData.ridersPerCategory[rider.category.name] ?? 0) + 1;

      const commissionRate = toNumber(rider.category.commissionPct)! / 100;
      for (const delivery of rider.deliveries) {
        zoneData.completedDeliveries += 1;
        zoneData.totalCommissions += toNumber(delivery.amount)! * commissionRate;
        if (delivery.customerRating !== null) {
          zoneData.ratings.push(toNumber(delivery.customerRating)!);
        }
      }

      zonesMap.set(rider.zone, zoneData);
    }

    return [...zonesMap.values()].map((zone) => ({
      zone: zone.zone,
      completedDeliveries: zone.completedDeliveries,
      totalCommissions: round(zone.totalCommissions),
      averageRating:
        zone.ratings.length === 0
          ? null
          : round(zone.ratings.reduce((sum, rating) => sum + rating, 0) / zone.ratings.length),
      ridersPerCategory: zone.ridersPerCategory,
    }));
  }
}
