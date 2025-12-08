import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class UpdateReservationDto {
  @IsMongoId()
  @IsOptional()
  doctor?: string;
  @IsOptional()
  @IsMongoId()
  patient?: string;
  @IsOptional()
  @IsMongoId()
  procedure?: string;
  @IsOptional()
  @IsString()
  slotStart?: string;
  @IsOptional()
  @IsString()
  slotEnd?: string;
  @IsOptional()
  @IsString()
  status?: string;
  @IsOptional()
  @IsString()
  notes?: string;
}
