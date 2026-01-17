import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PatientCardsController } from './patient-cards.controller';
import { PatientCardsService } from './patient-cards.service';
import { PatientCard, PatientCardSchema } from '../entities/patient-card.entity';
import { Patient, PatientSchema } from '../entities/patient.entity';
import { Doctor, DoctorSchema } from '../entities/doctor.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PatientCard.name, schema: PatientCardSchema },
      { name: Patient.name, schema: PatientSchema },
      { name: Doctor.name, schema: DoctorSchema },
    ]),
  ],
  controllers: [PatientCardsController],
  providers: [PatientCardsService],
  exports: [PatientCardsService],
})
export class PatientCardsModule {}



