import { Module } from "@nestjs/common";
import { TimeslotsController } from "./timeslots.controller";
import { TimeslotsService } from "./timeslots.service";
import { MongooseModule } from "@nestjs/mongoose";
import { TimeSlot, TimeSlotSchema } from "./timeslot.entity";
import { Doctor, DoctorSchema } from "../doctors/doctor.entity";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TimeSlot.name, schema: TimeSlotSchema },
      { name: Doctor.name, schema: DoctorSchema },
    ]),
  ],
  controllers: [TimeslotsController],
  providers: [TimeslotsService],
  exports: [],
})
export class TimeslotsModule {}
