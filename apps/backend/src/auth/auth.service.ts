/**
 * Step-by-step:
 * 1) Selects user collection by role (patient/doctor/admin).
 * 2) Looks up user by email; throws on missing user.
 * 3) Validates password (bcrypt hash or legacy plain text).
 * 4) Builds JwtPayload and signs JWT with JwtService.
 * 5) Returns token + minimal user profile for the frontend.
 * Uses: Mongoose models, bcrypt, JwtService.
 * Used by: AuthController.login.
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Patient } from '../entities/patient.entity';
import { Doctor } from '../entities/doctor.entity';
import { ClinicAdmin } from '../entities/clinic-admin.entity';
import { LoginDto, LoginResponseDto, UserRole } from './dto/login.dto';
import { JwtPayload } from './decorators/current-user.decorator';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<Patient>,
    @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,
    @InjectModel(ClinicAdmin.name) private clinicAdminModel: Model<ClinicAdmin>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password, role } = loginDto;

    let user: Patient | Doctor | ClinicAdmin | null = null;

    switch (role) {
      case 'patient':
        user = await this.patientModel.findOne({ email });
        break;
      case 'doctor':
        user = await this.doctorModel.findOne({ email });
        break;
      case 'admin':
        user = await this.clinicAdminModel.findOne({ email });
        break;
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.validatePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      role: role,
    };
  }

  private async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    // Support both bcrypt hashed passwords and plain text (for migration)
    if (hashedPassword.startsWith('$2')) {
      // bcrypt hash
      return bcrypt.compare(plainPassword, hashedPassword);
    }
    // Plain text comparison (legacy - should be migrated)
    return plainPassword === hashedPassword;
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async validateToken(token: string): Promise<JwtPayload | null> {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      return null;
    }
  }
}
