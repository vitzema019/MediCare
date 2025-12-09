import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PatientCard } from '../entities/patient-card.entity';
import { CreatePatientCardDto } from './dto/create-patient-card.dto';
import { UpdatePatientCardDto } from './dto/update-patient-card.dto';

@Injectable()
export class PatientCardsService {
  constructor(
    @InjectModel(PatientCard.name) private patientCardModel: Model<PatientCard>,
  ) {}

  /**
   * Get or create a patient card for a doctor-patient pair
   */
  async getOrCreate(doctorId: string, patientId: string): Promise<PatientCard> {
    const card = await this.patientCardModel.findOne({
      doctor: new Types.ObjectId(doctorId),
      patient: new Types.ObjectId(patientId),
    }).lean();

    if (card) {
      return card as any;
    }

    // Create a new patient card
    const newCard = await this.patientCardModel.create({
      doctor: new Types.ObjectId(doctorId),
      patient: new Types.ObjectId(patientId),
      visitHistory: [],
    });

    return newCard;
  }

  /**
   * Get a patient card by doctor and patient IDs
   */
  async findByDoctorAndPatient(doctorId: string, patientId: string): Promise<PatientCard | null> {
    const card = await this.patientCardModel
      .findOne({
        doctor: new Types.ObjectId(doctorId),
        patient: new Types.ObjectId(patientId),
      })
      .populate('doctor', 'firstName lastName email')
      .populate('patient', 'firstName lastName email phoneNumber address')
      .lean();

    return card as any;
  }

  /**
   * Get all patient cards for a doctor
   */
  async findByDoctor(doctorId: string): Promise<PatientCard[]> {
    const cards = await this.patientCardModel
      .find({
        doctor: new Types.ObjectId(doctorId),
      })
      .populate('doctor', 'firstName lastName email')
      .populate('patient', 'firstName lastName email phoneNumber address')
      .sort({ updatedAt: -1 })
      .lean();

    return cards as any;
  }

  /**
   * Get a patient card by ID
   */
  async findById(id: string): Promise<PatientCard> {
    const card = await this.patientCardModel
      .findById(id)
      .populate('doctor', 'firstName lastName email')
      .populate('patient', 'firstName lastName email phoneNumber address')
      .lean();

    if (!card) {
      throw new NotFoundException(`Patient card with ID ${id} not found`);
    }

    return card as any;
  }

  /**
   * Create a new patient card
   */
  async create(createDto: CreatePatientCardDto): Promise<PatientCard> {
    // Check if card already exists
    const existing = await this.patientCardModel.findOne({
      doctor: new Types.ObjectId(createDto.doctorId),
      patient: new Types.ObjectId(createDto.patientId),
    });

    if (existing) {
      throw new BadRequestException('Patient card already exists for this doctor-patient pair');
    }

    const card = await this.patientCardModel.create({
      doctor: new Types.ObjectId(createDto.doctorId),
      patient: new Types.ObjectId(createDto.patientId),
      medicalHistory: createDto.medicalHistory,
      allergies: createDto.allergies,
      currentMedications: createDto.currentMedications,
      notes: createDto.notes,
      bloodType: createDto.bloodType,
      height: createDto.height,
      weight: createDto.weight,
      emergencyContact: createDto.emergencyContact,
      visitHistory: [],
    });

    return card;
  }

  /**
   * Update a patient card
   */
  async update(id: string, updateDto: UpdatePatientCardDto): Promise<PatientCard> {
    const card = await this.patientCardModel.findByIdAndUpdate(
      id,
      { $set: updateDto },
      { new: true, runValidators: true }
    )
      .populate('doctor', 'firstName lastName email')
      .populate('patient', 'firstName lastName email phoneNumber address')
      .lean();

    if (!card) {
      throw new NotFoundException(`Patient card with ID ${id} not found`);
    }

    return card as any;
  }

  /**
   * Add a visit to the patient card's visit history
   */
  async addVisit(
    doctorId: string,
    patientId: string,
    visitData: {
      date: Date;
      procedure: string;
      notes?: string;
      reservationId: string;
    }
  ): Promise<PatientCard> {
    const card = await this.patientCardModel.findOne({
      doctor: new Types.ObjectId(doctorId),
      patient: new Types.ObjectId(patientId),
    });

    if (!card) {
      throw new NotFoundException('Patient card not found');
    }

    // Add visit to history
    if (!card.visitHistory) {
      card.visitHistory = [];
    }

    card.visitHistory.push(visitData);
    await card.save();

    return card;
  }
}



