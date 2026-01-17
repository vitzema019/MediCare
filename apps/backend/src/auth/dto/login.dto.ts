import { IsEmail, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export type UserRole = 'patient' | 'doctor' | 'admin';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password!: string;

  @ApiProperty({ enum: ['patient', 'doctor', 'admin'], example: 'patient' })
  @IsEnum(['patient', 'doctor', 'admin'])
  role!: UserRole;
}

export class LoginResponseDto {
  @ApiProperty()
  access_token!: string;

  @ApiProperty()
  user!: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  @ApiProperty({ enum: ['patient', 'doctor', 'admin'] })
  role!: UserRole;
}
