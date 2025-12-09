import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsEnum(['doctor', 'patient'])
  senderType!: 'doctor' | 'patient';

  @IsOptional()
  @IsString()
  reservationId?: string;

  @IsOptional()
  @IsString()
  subject?: string;
}



