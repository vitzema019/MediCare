import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Clinic extends Document {
  @Prop({ required: true })
  name!: string;

  @Prop()
  address?: string;

  @Prop()
  phoneNumber?: string;

  @Prop()
  email?: string;

  @Prop()
  description?: string;

  @Prop({ default: true })
  active!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ClinicSchema = SchemaFactory.createForClass(Clinic);



