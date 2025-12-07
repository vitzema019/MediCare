import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';
import { Procedure } from './procedure.entity';

@Schema()
export class Reservation extends Document {
  @Prop({ type: Types.ObjectId, ref: Doctor.name })
  doctor!: Doctor;

  @Prop({ type: Types.ObjectId, ref: Patient.name })
  patient!: Patient;

  @Prop({ type: Types.ObjectId, ref: Procedure.name })
  procedure!: Procedure;

  @Prop()
  slotStart!: string;

  @Prop()
  slotEnd!: string;

  @Prop({ enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' })
  status!: string;

  @Prop()
  notes?: string;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);
