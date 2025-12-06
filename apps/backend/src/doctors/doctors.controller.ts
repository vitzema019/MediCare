import { Body, Controller, Post } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import type { SetAvailabilityDtoOut } from '@shared/types';

// TODO: replace with real auth decorator once available
const mockCurrentUser = { id: 'USER-DOCTOR-1', doctorId: 'DOC-1', roles: ['doctor'] };

@Controller()
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post('doctor/setAvailability')
  async setAvailability(
    @Body() dto: SetAvailabilityDto,
  ): Promise<SetAvailabilityDtoOut> {
    return this.doctorsService.setAvailability(dto, mockCurrentUser);
  }
}
