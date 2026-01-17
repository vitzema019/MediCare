import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';

@Schema({ timestamps: true })
export class PatientCard extends Document {
  @Prop({ type: Types.ObjectId, ref: Doctor.name, required: true })
  doctor!: Doctor;

  @Prop({ type: Types.ObjectId, ref: Patient.name, required: true })
  patient!: Patient;

  @Prop()
  dateOfBirth?: Date;

  @Prop()
  medicalHistory?: string;

  @Prop()
  allergies?: string;

  @Prop()
  currentMedications?: string;

  @Prop()
  notes?: string;

  @Prop()
  bloodType?: string;

  @Prop()
  height?: number; // in cm

  @Prop()
  weight?: number; // in kg

  @Prop({
    type: {
      name: { type: String, required: false },
      phone: { type: String, required: false },
      relationship: { type: String, required: false },
    },
    required: false,
  })
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };

  @Prop({
    type: [{
      date: { type: Date, required: true },
      procedure: { type: String, required: true },
      notes: { type: String, required: false },
      reservationId: { type: String, required: true },
    }],
    default: [],
  })
  visitHistory?: Array<{
    date: Date;
    procedure: string;
    notes?: string;
    reservationId: string;
  }>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PatientCardSchema = SchemaFactory.createForClass(PatientCard);

// Create compound index to ensure one card per doctor-patient pair
PatientCardSchema.index({ doctor: 1, patient: 1 }, { unique: true });

