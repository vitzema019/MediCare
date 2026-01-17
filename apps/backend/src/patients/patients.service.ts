import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Patient } from '../entities/patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<Patient>,
  ) {}

  async create(createPatientDto: CreatePatientDto): Promise<Patient> {
    // Check if patient with this email already exists
    const existingPatient = await this.patientModel.findOne({
      email: createPatientDto.email,
    });

    if (existingPatient) {
      throw new ConflictException('Patient with this email already exists');
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(createPatientDto.password, 10);
    const patient = await this.patientModel.create({
      ...createPatientDto,
      password: hashedPassword,
    });
    return patient;
  }

  async findByEmail(email: string) {
    return this.patientModel.findOne({ email }).lean();
  }

  async findById(id: string) {
    return this.patientModel.findById(id).lean();
  }

  async findAll() {
    return this.patientModel.find().select('-password').lean();
  }
}

