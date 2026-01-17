/**
 * Step-by-step:
 * 1) Defines LoginDto request shape and validation rules.
 * 2) Defines LoginResponseDto used for Swagger + controller responses.
 * 3) Exports UserRole union for guards/decorators.
 * Uses: class-validator + Swagger decorators.
 * Used by: AuthController, AuthService, RolesGuard.
 */
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
