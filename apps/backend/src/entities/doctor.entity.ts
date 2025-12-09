import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface DaySchedule {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // Format: "HH:mm" (e.g., "09:00")
  endTime: string; // Format: "HH:mm" (e.g., "17:00")
  enabled: boolean;
}

@Schema({ timestamps: true })
export class Doctor extends Document {
  @Prop()
  firstName!: string;

  @Prop()
  lastName!: string;

  @Prop({ unique: true })
  email!: string;

  @Prop()
  password!: string;

  @Prop({ default: true })
  active!: boolean;

  @Prop({ type: [{
    dayOfWeek: { type: Number, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    enabled: { type: Boolean, default: true }
  }], default: [] })
  availableHours!: DaySchedule[];

  @Prop()
  specialty?: string; // e.g., "Cardiology", "Pediatrics", "General Practice"

  @Prop()
  department?: string; // Department/group assignment

  @Prop()
  phoneNumber?: string;

  @Prop()
  licenseNumber?: string;
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);
