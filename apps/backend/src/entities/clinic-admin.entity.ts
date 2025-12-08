import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Clinic } from './clinic.entity';

@Schema({ timestamps: true })
export class ClinicAdmin extends Document {
  @Prop({ required: true })
  firstName!: string;

  @Prop({ required: true })
  lastName!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  password!: string; // In production, this should be hashed

  @Prop({ type: Types.ObjectId, ref: Clinic.name })
  clinic?: Clinic;

  @Prop({ default: true })
  active!: boolean;

  @Prop({ default: 'clinic_admin' })
  role!: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ClinicAdminSchema = SchemaFactory.createForClass(ClinicAdmin);



