import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ConfirmReservationDto {
  @IsEnum(['confirmed', 'cancelled'])
  status!: 'confirmed' | 'cancelled';

  @IsOptional()
  @IsString()
  message?: string;
}



