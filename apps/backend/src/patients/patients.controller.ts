import { Controller, Post, Get, Patch, Param, Body, BadRequestException, UseGuards } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { LoginPatientDto } from './dto/login-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @UseGuards(RolesGuard)
  @Roles('admin', 'doctor')
  @Get()
  async findAll() {
    return this.patientsService.findAll();
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'doctor')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
    return this.patientsService.update(id, updatePatientDto);
  }

  @Public()
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

  @Public()
  @Post('login')
  async login(@Body() loginPatientDto: LoginPatientDto) {
    if (!loginPatientDto.email || !loginPatientDto.password) {
      throw new BadRequestException('Email and password are required');
    }

    const patient = await this.patientsService.findByEmail(loginPatientDto.email);

    if (!patient) {
      throw new BadRequestException('Invalid email or password');
    }

    // Compare hashed passwords using bcrypt
    const isPasswordValid = await bcrypt.compare(loginPatientDto.password, patient.password);
    if (!isPasswordValid) {
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
