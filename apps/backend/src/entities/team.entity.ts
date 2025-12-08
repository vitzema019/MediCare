import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Doctor } from './doctor.entity';

@Schema({ timestamps: true })
export class Team extends Document {
  @Prop({ required: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop()
  department?: string;

  @Prop()
  scope?: string; // e.g., "Emergency", "Surgery", "Outpatient", etc.

  @Prop({ type: [{ type: Types.ObjectId, ref: Doctor.name }], default: [] })
  doctors!: Doctor[];

  @Prop()
  color?: string; // For UI display (hex color code)

  @Prop({ default: true })
  active!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TeamSchema = SchemaFactory.createForClass(Team);

