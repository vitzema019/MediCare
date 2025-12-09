import { IsString, MinLength, MaxLength, IsOptional, IsDateString, IsMongoId } from 'class-validator';

export class RequestUpdateDto {
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  message!: string;

  @IsOptional()
  @IsDateString()
  requestedSlotStart?: string;

  @IsOptional()
  @IsDateString()
  requestedSlotEnd?: string;

  @IsOptional()
  @IsMongoId()
  requestedDoctorId?: string;

  @IsOptional()
  @IsMongoId()
  requestedProcedureId?: string;

  @IsOptional()
  @IsMongoId()
  requestedDepartmentId?: string;
}



