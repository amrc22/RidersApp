import { IsInt, IsNumber, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateDeliveryDto {
  @IsInt()
  riderId: number;

  @IsString()
  @MaxLength(255)
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;
}
