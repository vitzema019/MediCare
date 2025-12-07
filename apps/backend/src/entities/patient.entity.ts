import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Patient extends Document {
  @Prop()
  firstName!: string;

  @Prop()
  lastName!: string;

  @Prop()
  email!: string;

  @Prop()
  phoneNumber!: string;

  @Prop()
  address!: string;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);
