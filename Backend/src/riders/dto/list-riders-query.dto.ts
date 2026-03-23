import { IsIn, IsOptional, IsString } from 'class-validator';

export class ListRidersQueryDto {
  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsIn(['pendiente', 'en_curso', 'completada', 'cancelada'])
  status?: 'pendiente' | 'en_curso' | 'completada' | 'cancelada';
}
