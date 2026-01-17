/**
 * Step-by-step:
 * 1) Registers Passport JWT strategy for auth.
 * 2) Configures JwtModule (secret + expiry).
 * 3) Registers Mongoose models used by AuthService (Patient/Doctor/Admin).
 * 4) Provides AuthService + JwtStrategy and exports AuthService/JwtModule.
 * Uses: entity schemas and JWT/Passport providers.
 * Used by: AppModule imports AuthModule for auth endpoints + guards.
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { Patient, PatientSchema } from '../entities/patient.entity';
import { Doctor, DoctorSchema } from '../entities/doctor.entity';
import { ClinicAdmin, ClinicAdminSchema } from '../entities/clinic-admin.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'medicare-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
    MongooseModule.forFeature([
      { name: Patient.name, schema: PatientSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: ClinicAdmin.name, schema: ClinicAdminSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
