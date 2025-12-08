import { Module } from "@nestjs/common";
import { TimeslotsController } from "./timeslots.controller";
import { TimeslotsService } from "./timeslots.service";
import { MongooseModule } from "@nestjs/mongoose";
import { TimeSlot, TimeSlotSchema } from "../entities/timeslot.entity";
import { Doctor, DoctorSchema } from "../entities/doctor.entity";
import { Reservation, ReservationSchema } from "../entities/reservation.entity";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TimeSlot.name, schema: TimeSlotSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: Reservation.name, schema: ReservationSchema },
    ]),
  ],
  controllers: [TimeslotsController],
  providers: [TimeslotsService],
  exports: [],
})
export class TimeslotsModule { }
