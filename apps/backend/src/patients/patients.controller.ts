import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { LoginPatientDto } from './dto/login-patient.dto';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post('register')
  async register(@Body() createPatientDto: CreatePatientDto) {
    const patient = await this.patientsService.create(createPatientDto);
    // Return patient data without password
    const patientDoc = patient.toObject ? patient.toObject() : patient as any;
    return {
      id: patientDoc._id?.toString() || patientDoc.id,
      firstName: patientDoc.firstName,
      lastName: patientDoc.lastName,
      email: patientDoc.email,
      phoneNumber: patientDoc.phoneNumber,
      address: patientDoc.address,
    };
  }

  @Post('login')
  async login(@Body() loginPatientDto: LoginPatientDto) {
    if (!loginPatientDto.email || !loginPatientDto.password) {
      throw new BadRequestException('Email and password are required');
    }

    const patient = await this.patientsService.findByEmail(loginPatientDto.email);
    
    if (!patient) {
      throw new BadRequestException('Invalid email or password');
    }

    // In production, use bcrypt to compare hashed passwords
    if (patient.password !== loginPatientDto.password) {
      throw new BadRequestException('Invalid email or password');
    }

    // Return patient data (without password)
    return {
      id: patient._id.toString(),
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      phoneNumber: patient.phoneNumber,
      address: patient.address,
    };
  }
}

