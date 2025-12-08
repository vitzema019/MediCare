import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Department extends Document {
  @Prop()
  name!: string;

  @Prop()
  address!: string;

  @Prop()
  phoneNumber!: string;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);
