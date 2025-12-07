import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Doctor extends Document {
  @Prop()
  firstName!: string;

  @Prop()
  lastName!: string;

  @Prop()
  active!: boolean;
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);
