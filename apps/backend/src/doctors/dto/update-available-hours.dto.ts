import { IsArray, ValidateNested, IsNumber, IsString, IsBoolean, Min, Max, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class DayScheduleDto {
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek!: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { message: 'startTime must be in HH:mm format' })
  startTime!: string; // Format: "HH:mm"

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { message: 'endTime must be in HH:mm format' })
  endTime!: string; // Format: "HH:mm"

  @IsBoolean()
  enabled!: boolean;
}

export class UpdateAvailableHoursDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayScheduleDto)
  availableHours!: DayScheduleDto[];
}



