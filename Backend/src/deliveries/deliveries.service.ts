import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { DeliveryStatusUpdate, UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { toNumber } from '../common/decimal.util';

@Injectable()
export class DeliveriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDeliveryDto) {
    const rider = await this.prisma.rider.findUnique({
      where: { id: dto.riderId },
    });

    if (!rider) {
      throw new NotFoundException('Rider no encontrado');
    }

    const delivery = await this.prisma.delivery.create({
      data: {
        riderId: dto.riderId,
        description: dto.description,
        amount: new Prisma.Decimal(dto.amount),
        status: 'pendiente',
        createdAt: new Date(),
      },
    });

    return {
      id: delivery.id,
      riderId: delivery.riderId,
      description: delivery.description,
      amount: toNumber(delivery.amount),
      status: delivery.status,
      createdAt: delivery.createdAt,
    };
  }

  async updateStatus(id: number, dto: UpdateDeliveryStatusDto) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
    });

    if (!delivery) {
      throw new NotFoundException('Entrega no encontrada');
    }

    if (delivery.status === 'completada' || delivery.status === 'cancelada') {
      throw new BadRequestException('Una entrega completada o cancelada no puede modificarse');
    }

    if (delivery.status === 'pendiente' && dto.status === DeliveryStatusUpdate.COMPLETADA) {
      throw new BadRequestException('No se puede pasar de pendiente a completada directamente');
    }

    if (dto.status === DeliveryStatusUpdate.COMPLETADA && dto.customerRating === undefined) {
      throw new BadRequestException(
        'La calificacion del cliente es obligatoria al completar la entrega',
      );
    }

    if (dto.status !== DeliveryStatusUpdate.COMPLETADA && dto.customerRating !== undefined) {
      throw new BadRequestException(
        'La calificacion solo se registra cuando la entrega pasa a completada',
      );
    }

    const updated = await this.prisma.delivery.update({
      where: { id },
      data: {
        status: dto.status,
        customerRating:
          dto.status === DeliveryStatusUpdate.COMPLETADA
            ? new Prisma.Decimal(dto.customerRating!)
            : null,
        completedAt: dto.status === DeliveryStatusUpdate.COMPLETADA ? new Date() : null,
        canceledAt: dto.status === DeliveryStatusUpdate.CANCELADA ? new Date() : null,
      },
    });

    return {
      id: updated.id,
      status: updated.status,
      customerRating: toNumber(updated.customerRating),
      completedAt: updated.completedAt,
      canceledAt: updated.canceledAt,
    };
  }
}
