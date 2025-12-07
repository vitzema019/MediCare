import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Procedure extends Document {
  @Prop()
  name!: string;

  @Prop()
  price!: number;

  @Prop()
  duration!: number;
}

export const ProcedureSchema = SchemaFactory.createForClass(Procedure);
