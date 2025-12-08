// DTO pro vstup commandu "Vytvoření rezervace"

import {
  IsBoolean,
  IsEmail,
  IsISO8601,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateReservationDto {
  @IsOptional()
  @IsString()
  patientId?: string;

  @IsString()
  departmentId!: string;

  @IsString()
  doctorId!: string;

  @IsString()
  procedureId!: string;

  @IsISO8601()
  slotStart!: string;

  @IsISO8601()
  slotEnd!: string;

  @IsEmail()
  contactEmail!: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsBoolean()
  gdprConsent!: boolean;

  @IsBoolean()
  medicalDataConsent!: boolean;
}