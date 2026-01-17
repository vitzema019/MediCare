import { Controller, Get, Post, Patch, Param, Body, NotFoundException, BadRequestException, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Doctor } from '../entities/doctor.entity';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { LoginDoctorDto } from './dto/login-doctor.dto';
import { UpdateAvailableHoursDto } from './dto/update-available-hours.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';

@Controller('doctors')
export class DoctorsController {
  constructor(
    @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,
    private readonly doctorsService: DoctorsService,
  ) {}

  @Public()
  @Get()
  async findAll() {
    const doctors = await this.doctorModel.find({ active: true }).select('_id firstName lastName').lean();
    return doctors.map(doctor => ({
      id: doctor._id.toString(),
      name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
    }));
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const doctor = await this.doctorModel.findById(id).lean();
    if (!doctor) {
      throw new NotFoundException(`Doctor with id ${id} not found`);
    }
    return {
      id: doctor._id.toString(),
      name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      active: doctor.active,
    };
  }

  @Public()
  @Post('register')
  async register(@Body() createDoctorDto: CreateDoctorDto) {
    const doctor = await this.doctorsService.create(createDoctorDto);
    // Return doctor data without password
    const doctorDoc = doctor.toObject ? doctor.toObject() : doctor as any;
    return {
      id: doctorDoc._id?.toString() || doctorDoc.id,
      firstName: doctorDoc.firstName,
      lastName: doctorDoc.lastName,
      email: doctorDoc.email,
      active: doctorDoc.active,
    };
  }

  @Public()
  @Post('login')
  async login(@Body() loginDoctorDto: LoginDoctorDto) {
    if (!loginDoctorDto.email || !loginDoctorDto.password) {
      throw new BadRequestException('Email and password are required');
    }

    const doctor = await this.doctorsService.findByEmail(loginDoctorDto.email);

    if (!doctor) {
      throw new BadRequestException('Invalid email or password');
    }

    // Compare hashed passwords using bcrypt
    const isPasswordValid = await bcrypt.compare(loginDoctorDto.password, doctor.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid email or password');
    }

    // Return doctor data (without password)
    return {
      id: doctor._id.toString(),
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      email: doctor.email,
      active: doctor.active,
    };
  }

  @Public()
  @Get(':id/available-hours')
  async getAvailableHours(@Param('id') id: string) {
    const doctor = await this.doctorModel.findById(id).lean();
    if (!doctor) {
      throw new NotFoundException(`Doctor with id ${id} not found`);
    }
    return {
      id: doctor._id.toString(),
      availableHours: doctor.availableHours || [],
    };
  }

  @UseGuards(RolesGuard)
  @Roles('doctor')
  @Patch(':id/available-hours')
  async updateAvailableHours(
    @Param('id') id: string,
    @Body() updateDto: UpdateAvailableHoursDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // Ensure doctor can only update their own available hours
    if (user.sub !== id) {
      throw new BadRequestException('You can only update your own available hours');
    }
    const doctor = await this.doctorsService.updateAvailableHours(id, updateDto.availableHours);
    return {
      id: doctor._id.toString(),
      availableHours: doctor.availableHours,
    };
  }
}

