import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AvailabilitySlotDto {
  @IsEnum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
  day!: string;

  @Matches(/^\d{2}:\d{2}$/)
  from!: string;

  @Matches(/^\d{2}:\d{2}$/)
  to!: string;
}

export class SetAvailabilityDto {
  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  availability!: AvailabilitySlotDto[];
}
