import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { TimeSlot } from "./timeslot.entity";
import { Model, Types } from "mongoose";
import { Doctor } from "../doctors/doctor.entity";
import { TimeSlotDto } from "./dto/timeslot.dto";
import { formatDateTime } from "./utils";

@Injectable()
export class TimeslotsService {
  constructor(
    @InjectModel(TimeSlot.name) private timeslotModel: Model<TimeSlot>,
    @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,
  ) {}

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
