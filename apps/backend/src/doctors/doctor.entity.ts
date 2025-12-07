import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Doctor extends Document {
  // TODO: just a stub, add required fields
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);
