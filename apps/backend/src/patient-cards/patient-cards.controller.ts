import { Controller, Get, Post, Patch, Body, Param, Query, NotFoundException, UseGuards, BadRequestException } from '@nestjs/common';
import { PatientCardsService } from './patient-cards.service';
import { CreatePatientCardDto } from './dto/create-patient-card.dto';
import { UpdatePatientCardDto } from './dto/update-patient-card.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(RolesGuard)
@Roles('doctor')
@Controller('patient-cards')
export class PatientCardsController {
  constructor(private readonly patientCardsService: PatientCardsService) {}

  /**
   * Get all patient cards for a doctor
   */
  @Get()
  async findAll(@Query('doctorId') doctorId: string) {
    if (!doctorId) {
      throw new BadRequestException('doctorId query parameter is required');
    }
    return this.patientCardsService.findByDoctor(doctorId);
  }

  /**
   * Get a specific patient card by doctor and patient IDs
   */
  @Get('by-doctor-patient')
  async findByDoctorAndPatient(
    @Query('doctorId') doctorId: string,
    @Query('patientId') patientId: string,
  ) {
    if (!doctorId || !patientId) {
      throw new BadRequestException('doctorId and patientId query parameters are required');
    }
    const card = await this.patientCardsService.findByDoctorAndPatient(doctorId, patientId);
    if (!card) {
      throw new NotFoundException('Patient card not found');
    }
    return card;
  }

  /**
   * Get a patient card by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.patientCardsService.findById(id);
  }

  /**
   * Create a new patient card
   */
  @Post()
  async create(@Body() createDto: CreatePatientCardDto) {
    return this.patientCardsService.create(createDto);
  }

  /**
   * Update a patient card
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdatePatientCardDto) {
    return this.patientCardsService.update(id, updateDto);
  }
}



