import { IsString, IsOptional, IsBoolean, IsEmail } from 'class-validator';

export class UpdateDoctorDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  specialty?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}



