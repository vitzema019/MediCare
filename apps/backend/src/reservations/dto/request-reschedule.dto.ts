import { IsString, MinLength, MaxLength, IsOptional, IsDateString } from 'class-validator';

export class RequestRescheduleDto {
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  message!: string;

  @IsDateString()
  requestedSlotStart!: string;

  @IsDateString()
  requestedSlotEnd!: string;
}



