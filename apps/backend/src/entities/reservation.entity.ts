import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';
import { Procedure } from './procedure.entity';

@Schema({ timestamps: true })
export class Reservation extends Document {
  @Prop({ type: Types.ObjectId, ref: Doctor.name })
  doctor!: Doctor;

  @Prop({ type: MongooseSchema.Types.Mixed }) // Use Mixed to allow both ObjectId and string (for mock IDs)
  patient!: Patient | string;

  @Prop({ type: MongooseSchema.Types.Mixed }) // Use Mixed to allow both ObjectId and string (for mock IDs)
  procedure!: Procedure | string;

  @Prop()
  slotStart!: string;

  @Prop()
  slotEnd!: string;

  @Prop({ enum: ['pending', 'confirmed', 'cancelled', 'cancellation_requested', 'reschedule_requested', 'update_requested'], default: 'pending' })
  status!: string;

  @Prop()
  cancellationRequestMessage?: string;

  @Prop()
  rescheduleRequestMessage?: string;

  @Prop()
  requestedSlotStart?: string;

  @Prop()
  requestedSlotEnd?: string;

  @Prop()
  updateRequestMessage?: string;

  @Prop()
  requestedDoctorId?: string;

  @Prop()
  requestedProcedureId?: string;

  @Prop()
  requestedDepartmentId?: string;

  @Prop()
  notes?: string;

  @Prop()
  code?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);
