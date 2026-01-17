import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TimeslotsService } from './timeslots.service';
import { GetTimeslotsQueryDto } from './dto/get-timeslots-query.dto';
import { TimeSlotDto } from './dto/timeslot.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('timeslots')
export class TimeslotsController {
  constructor(private readonly timeslotsService: TimeslotsService) {}

  @Public()
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

  @UseGuards(RolesGuard)
  @Roles('doctor', 'admin')
  @Post(':doctorId')
  addTimeSlot(
    @Param('doctorId') doctorId: string,
    @Body() addTimeSlotDto: TimeSlotDto,
  ) {
    return this.timeslotsService.addTimeSlot(doctorId, addTimeSlotDto);
  }

  @UseGuards(RolesGuard)
  @Roles('doctor', 'admin')
  @Delete(':doctorId')
  removeTimeSlot(
    @Param('doctorId') doctorId: string,
    @Body() removeTimeSlotDto: TimeSlotDto,
  ) {
    return this.timeslotsService.removeTimeSlot(doctorId, removeTimeSlotDto);
  }
}
