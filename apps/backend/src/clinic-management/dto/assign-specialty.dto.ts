import { IsString, IsOptional } from 'class-validator';

export class AssignSpecialtyDto {
  @IsString()
  @IsOptional()
  specialty?: string;

  @IsString()
  @IsOptional()
  department?: string;
}



