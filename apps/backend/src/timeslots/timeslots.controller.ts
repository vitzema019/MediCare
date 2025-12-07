import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { TimeslotsService } from './timeslots.service';
import { GetTimeslotsQueryDto } from './dto/get-timeslots-query.dto';
import { TimeSlotDto } from './dto/timeslot.dto';

@Controller('timeslots')
export class TimeslotsController {
  constructor(private readonly timeslotsService: TimeslotsService) {}

  @Get(':doctorId')
  findAvailableTimeslots(
    @Param('doctorId') doctorId: string,
    @Query() query: GetTimeslotsQueryDto,
  ) {
    return this.timeslotsService.findAvailableTimeSlots(
      doctorId,
      query.fromDate,
      query.toDate,
    );
  }

  @Post(':doctorId')
  addTimeSlot(
    @Param('doctorId') doctorId: string,
    @Body() addTimeSlotDto: TimeSlotDto,
  ) {
    return this.timeslotsService.addTimeSlot(doctorId, addTimeSlotDto);
  }

  @Delete(':doctorId')
  removeTimeSlot(
    @Param('doctorId') doctorId: string,
    @Body() removeTimeSlotDto: TimeSlotDto,
  ) {
    return this.timeslotsService.removeTimeSlot(doctorId, removeTimeSlotDto);
  }
}
