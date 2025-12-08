import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { TimeSlot } from "../entities/timeslot.entity";
import { Model, Types } from "mongoose";
import { Doctor } from "../entities/doctor.entity";
import { Reservation } from "../entities/reservation.entity";
import { TimeSlotDto } from "./dto/timeslot.dto";
import { formatDateTime } from "./utils";

@Injectable()
export class TimeslotsService {
  constructor(
    @InjectModel(TimeSlot.name) private timeslotModel: Model<TimeSlot>,
    @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,
    @InjectModel(Reservation.name) private reservationModel: Model<Reservation>,
  ) { }

  async addTimeSlot(doctorId: string, addTimeSlotDto: TimeSlotDto) {
    addTimeSlotDto.validate();
    await this.validateDoctorId(doctorId);

    // delete existing nested timeslots
    await this.timeslotModel.deleteMany({
      doctor: new Types.ObjectId(doctorId),
      from: { $gte: addTimeSlotDto.fromDate },
      to: { $lte: addTimeSlotDto.toDate },
    });

    const beforeOverlapingTimeSlot = await this.timeslotModel.findOneAndUpdate(
      {
        doctor: new Types.ObjectId(doctorId),
        to: { $gte: addTimeSlotDto.fromDate, $lte: addTimeSlotDto.toDate },
      },
      {
        $set: { to: addTimeSlotDto.toDate },
      },
      { new: true },
    );

    const afterOverlapingTimeSlot = await this.timeslotModel.findOneAndUpdate(
      {
        doctor: new Types.ObjectId(doctorId),
        from: { $gte: addTimeSlotDto.fromDate, $lte: addTimeSlotDto.toDate },
      },
      {
        $set: { from: addTimeSlotDto.fromDate },
      },
      { new: true },
    );

    if (beforeOverlapingTimeSlot && afterOverlapingTimeSlot) {
      beforeOverlapingTimeSlot.to = afterOverlapingTimeSlot.to;
      await beforeOverlapingTimeSlot.save();
      await afterOverlapingTimeSlot.deleteOne();
    } else if (!beforeOverlapingTimeSlot && !afterOverlapingTimeSlot) {
      await this.timeslotModel.insertOne({
        doctor: new Types.ObjectId(doctorId),
        from: addTimeSlotDto.fromDate,
        to: addTimeSlotDto.toDate,
      });
    }
  }

  async removeTimeSlot(doctorId: string, removeTimeSlotDto: TimeSlotDto) {
    removeTimeSlotDto.validate();
    await this.validateDoctorId(doctorId);
    await this.timeslotModel.deleteMany({
      doctor: new Types.ObjectId(doctorId),
      from: { $gte: removeTimeSlotDto.fromDate },
      to: { $lte: removeTimeSlotDto.toDate },
    });
    const overlappingTimeSlotOld = await this.timeslotModel.findOneAndUpdate(
      {
        doctor: new Types.ObjectId(doctorId),
        from: { $lt: removeTimeSlotDto.fromDate },
        to: { $gt: removeTimeSlotDto.toDate },
      },
      {
        $set: {
          to: removeTimeSlotDto.fromDate,
        },
      },
    );
    if (overlappingTimeSlotOld) {
      await this.timeslotModel.insertOne({
        doctor: new Types.ObjectId(doctorId),
        from: removeTimeSlotDto.toDate,
        to: overlappingTimeSlotOld.to,
      });
    } else {
      // overlapping before
      await this.timeslotModel.updateOne(
        {
          doctor: new Types.ObjectId(doctorId),
          to: {
            $gt: removeTimeSlotDto.fromDate,
            $lte: removeTimeSlotDto.toDate,
          },
        },
        {
          $set: {
            to: removeTimeSlotDto.fromDate,
          },
        },
      );
      // overlapping after
      await this.timeslotModel.updateOne(
        {
          doctor: new Types.ObjectId(doctorId),
          from: {
            $gte: removeTimeSlotDto.fromDate,
            $lt: removeTimeSlotDto.toDate,
          },
        },
        {
          $set: {
            from: removeTimeSlotDto.toDate,
          },
        },
      );
    }
  }

  async findAvailableTimeSlots(doctorId: string, fromDate: Date, toDate: Date) {
    await this.validateDoctorId(doctorId);
    
    // Get doctor with available hours configuration
    const doctor = await this.doctorModel.findById(doctorId).lean();
    if (!doctor) {
      throw new BadRequestException(`Doctor with id '${doctorId}' does not exist`);
    }

    console.log(`[TimeslotsService] Doctor found: ${doctor.firstName} ${doctor.lastName}`);
    console.log(`[TimeslotsService] Doctor has availableHours:`, doctor.availableHours ? `YES (${doctor.availableHours.length} entries)` : 'NO');
    if (doctor.availableHours) {
      console.log(`[TimeslotsService] Available hours:`, JSON.stringify(doctor.availableHours, null, 2));
    }

    // Normalize dates to start of day for fromDate and end of day for toDate (using UTC)
    const normalizedFromDate = new Date(fromDate);
    normalizedFromDate.setUTCHours(0, 0, 0, 0);
    
    const normalizedToDate = new Date(toDate);
    normalizedToDate.setUTCHours(23, 59, 59, 999);

    // If doctor has configured available hours, generate slots from them
    if (doctor.availableHours && Array.isArray(doctor.availableHours) && doctor.availableHours.length > 0) {
      console.log(`[TimeslotsService] Generating slots for doctor ${doctorId} from ${normalizedFromDate.toISOString()} to ${normalizedToDate.toISOString()}`);
      const slots = await this.generateSlotsFromAvailableHours(doctorId, doctor.availableHours, normalizedFromDate, normalizedToDate);
      console.log(`[TimeslotsService] Generated ${slots.length} slots total`);
      return slots;
    }
    
    console.log(`[TimeslotsService] No available hours configured, falling back to timeslot model`);

    // Fallback to existing timeslot model behavior
    const timeslots = await this.timeslotModel
      .find({
        from: { $gte: fromDate },
        to: { $lte: toDate },
        doctor: new Types.ObjectId(doctorId),
      })
      .select("from to -_id");
    return timeslots.map((slot) => ({
      from: formatDateTime(slot.from),
      to: formatDateTime(slot.to),
    }));
  }

  private async generateSlotsFromAvailableHours(
    doctorId: string,
    availableHours: Array<{ dayOfWeek: number; startTime: string; endTime: string; enabled: boolean }>,
    fromDate: Date,
    toDate: Date,
  ) {
    const availableSlots: Array<{ from: string; to: string }> = [];
    const slotDurationMinutes = 30; // Default slot duration, can be made configurable

    // Get all existing reservations for this doctor that might overlap with the date range
    const fromDateISO = fromDate.toISOString();
    const toDateISO = toDate.toISOString();
    
    const reservations = await this.reservationModel.find({
      doctor: new Types.ObjectId(doctorId),
      $or: [
        // Reservations that start within our range
        { slotStart: { $gte: fromDateISO, $lte: toDateISO } },
        // Reservations that end within our range
        { slotEnd: { $gte: fromDateISO, $lte: toDateISO } },
        // Reservations that span our entire range
        { 
          slotStart: { $lte: fromDateISO },
          slotEnd: { $gte: toDateISO }
        }
      ],
      status: { $ne: 'cancelled' },
    }).lean();

    // Create a set of booked time ranges for quick lookup
    const bookedRanges = reservations.map(res => ({
      start: new Date(res.slotStart),
      end: new Date(res.slotEnd),
    }));

    // Iterate through each day in the date range
    const currentDate = new Date(fromDate);
    currentDate.setUTCHours(0, 0, 0, 0);
    
    const endDate = new Date(toDate);
    endDate.setUTCHours(23, 59, 59, 999);
    
    console.log(`[TimeslotsService] Date range: ${currentDate.toISOString()} to ${endDate.toISOString()}`);
    console.log(`[TimeslotsService] Available hours count: ${availableHours.length}`);
    
    while (currentDate <= endDate) {
      // Use UTC day of week to match the stored dayOfWeek values
      const dayOfWeek = currentDate.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
      
      // Find matching schedule for this day
      const daySchedule = availableHours.find(
        schedule => schedule.dayOfWeek === dayOfWeek && schedule.enabled
      );
      
      console.log(`[TimeslotsService] Processing ${dayName} (dayOfWeek: ${dayOfWeek}), found schedule:`, daySchedule ? 'YES' : 'NO');

      if (daySchedule) {
        // Parse start and end times
        const [startHour, startMinute] = daySchedule.startTime.split(':').map(Number);
        const [endHour, endMinute] = daySchedule.endTime.split(':').map(Number);

        // Create slots for this day using UTC to avoid timezone issues
        const slotStart = new Date(currentDate);
        slotStart.setUTCHours(startHour, startMinute, 0, 0);

        const dayEnd = new Date(currentDate);
        dayEnd.setUTCHours(endHour, endMinute, 0, 0);
        
        // Make sure we don't generate slots beyond the requested date range
        if (slotStart > endDate) {
          currentDate.setUTCDate(currentDate.getUTCDate() + 1);
          continue;
        }
        
        // Adjust dayEnd if it goes beyond the requested range
        if (dayEnd > endDate) {
          dayEnd.setTime(endDate.getTime());
        }

        // Generate slots in 30-minute intervals
        let slotTime = new Date(slotStart);
        while (slotTime < dayEnd) {
          const slotEndTime = new Date(slotTime);
          slotEndTime.setUTCMinutes(slotEndTime.getUTCMinutes() + slotDurationMinutes);

          // Check if this slot overlaps with any booked reservation
          const isBooked = bookedRanges.some(booked => {
            return (slotTime >= booked.start && slotTime < booked.end) ||
                   (slotEndTime > booked.start && slotEndTime <= booked.end) ||
                   (slotTime <= booked.start && slotEndTime >= booked.end);
          });

          if (!isBooked && slotEndTime <= dayEnd) {
            availableSlots.push({
              from: formatDateTime(slotTime),
              to: formatDateTime(slotEndTime),
            });
          }

          // Move to next slot
          slotTime.setUTCMinutes(slotTime.getUTCMinutes() + slotDurationMinutes);
        }
      }

      // Move to next day
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    return availableSlots;
  }

  private async validateDoctorId(doctorId: string) {
    if (
      !Types.ObjectId.isValid(doctorId) ||
      (await this.doctorModel.findById(doctorId)) == null
    ) {
      throw new BadRequestException(
        `Doctor with id '${doctorId}' does not exist`,
      );
    }
  }
}
