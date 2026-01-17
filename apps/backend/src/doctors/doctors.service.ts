import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Doctor, DaySchedule } from '../entities/doctor.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,
  ) {}

  async create(createDoctorDto: CreateDoctorDto): Promise<Doctor> {
    // Check if doctor with this email already exists
    const existingDoctor = await this.doctorModel.findOne({
      email: createDoctorDto.email,
    });

    if (existingDoctor) {
      throw new ConflictException('Doctor with this email already exists');
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(createDoctorDto.password, 10);
    const doctor = await this.doctorModel.create({
      ...createDoctorDto,
      password: hashedPassword,
      active: true, // New doctors are active by default
    });
    return doctor;
  }

  async findByEmail(email: string) {
    return this.doctorModel.findOne({ email }).lean();
  }

  async findById(id: string) {
    return this.doctorModel.findById(id).lean();
  }

  async updateAvailableHours(id: string, availableHours: DaySchedule[]): Promise<Doctor> {
    const doctor = await this.doctorModel.findById(id);
    if (!doctor) {
      throw new NotFoundException(`Doctor with id ${id} not found`);
    }

    doctor.availableHours = availableHours;
    await doctor.save();
    return doctor;
  }
}

