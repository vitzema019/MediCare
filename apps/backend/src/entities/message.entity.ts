import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';
import { Reservation } from './reservation.entity';

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ type: Types.ObjectId, ref: Doctor.name })
  doctor?: Doctor | Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Patient.name })
  patient?: Patient | Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Reservation.name })
  reservation?: Reservation | Types.ObjectId;

  @Prop({ required: true })
  content!: string;

  @Prop({ enum: ['doctor', 'patient'], required: true })
  senderType!: string;

  @Prop({ default: false })
  isRead!: boolean;

  @Prop()
  subject?: string; // e.g., "Appointment Confirmed", "Appointment Declined"

  createdAt?: Date;
  updatedAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);



