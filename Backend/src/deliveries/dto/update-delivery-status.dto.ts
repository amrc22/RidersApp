import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';

export enum DeliveryStatusUpdate {
  EN_CURSO = 'en_curso',
  COMPLETADA = 'completada',
  CANCELADA = 'cancelada',
}

export class UpdateDeliveryStatusDto {
  @IsEnum(DeliveryStatusUpdate)
  status: DeliveryStatusUpdate;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(5)
  customerRating?: number;
}
