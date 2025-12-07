import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Doctor } from "../doctors/doctor.entity";

@Schema()
export class TimeSlot extends Document {
  @Prop()
  from!: Date;

  @Prop()
  to!: Date;

  @Prop({ type: Types.ObjectId, ref: "Doctor" })
  doctor!: Doctor;
}

export const TimeSlotSchema = SchemaFactory.createForClass(TimeSlot);
