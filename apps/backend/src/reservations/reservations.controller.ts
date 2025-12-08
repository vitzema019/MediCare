import { Body, Controller, Delete, Get, Param, Patch, Post, Query, BadRequestException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CreateReservationResponseDto } from './dto/create-reservation.response';
import { IdParamDto } from './dto/id-param.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ConfirmReservationDto } from './dto/confirm-reservation.dto';
import { RequestCancellationDto } from './dto/request-cancellation.dto';
import { RequestRescheduleDto } from './dto/request-reschedule.dto';
import { RequestUpdateDto } from './dto/request-update.dto';

// TODO: až budete mít auth, nahradí se mock currentUser decorator.
const mockCurrentUser = { id: 'USER-1', patientId: 'PAT-1' };

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) { }

  @Get()
  async findAll(@Query('patientId') patientId?: string, @Query('doctorId') doctorId?: string) {
    if (doctorId) {
      // Get reservations for a specific doctor
      return this.reservationsService.findByDoctor(doctorId);
    }
    // For now, use mock patient ID. Later: @CurrentUser() user
    const targetPatientId = patientId || mockCurrentUser.patientId;
    return this.reservationsService.findAll(targetPatientId);
  }

  @Post()
  async create(
    @Body() dto: CreateReservationDto,
  ): Promise<CreateReservationResponseDto> {
    // v budoucnu: @CurrentUser() user
    return this.reservationsService.create(dto, mockCurrentUser);
  }

  @Patch(':id')
  async updateReservation(
    @Param() params: IdParamDto,
    @Body() updateReservationDto: UpdateReservationDto,
  ) {
    return await this.reservationsService.updateReservation(
      params.id,
      updateReservationDto,
    );
  }

  @Delete(':id')
  async removeReservation(@Param() params: IdParamDto) {
    return await this.reservationsService.removeReservation(params.id);
  }

  @Post(':id/confirm')
  async confirmReservation(
    @Param() params: IdParamDto,
    @Body() confirmDto: ConfirmReservationDto,
    @Query('doctorId') doctorId?: string,
  ) {
    // TODO: Get doctorId from auth context
    const docId = doctorId || 'DOC-1';
    return await this.reservationsService.confirmReservation(
      params.id,
      confirmDto.status,
      confirmDto.message,
      docId,
    );
  }

  @Post(':id/request-cancellation')
  async requestCancellation(
    @Param() params: IdParamDto,
    @Body() requestDto: RequestCancellationDto,
  ) {
    return await this.reservationsService.requestCancellation(
      params.id,
      requestDto.message,
    );
  }

  @Patch(':id/accept-cancellation')
  async acceptCancellation(
    @Param() params: IdParamDto,
    @Query('doctorId') doctorId?: string,
  ) {
    const docId = doctorId || 'DOC-1';
    return await this.reservationsService.acceptCancellation(
      params.id,
      docId,
    );
  }

  @Patch(':id/decline-cancellation')
  async declineCancellation(
    @Param() params: IdParamDto,
    @Body() declineDto: ConfirmReservationDto,
    @Query('doctorId') doctorId?: string,
  ) {
    if (!doctorId) {
      throw new BadRequestException('doctorId is required');
    }
    return await this.reservationsService.declineCancellation(
      params.id,
      declineDto.message || 'Cancellation request declined',
      doctorId,
    );
  }

  @Post(':id/request-reschedule')
  async requestReschedule(
    @Param() params: IdParamDto,
    @Body() requestDto: RequestRescheduleDto,
  ) {
    return await this.reservationsService.requestReschedule(
      params.id,
      requestDto.message,
      requestDto.requestedSlotStart,
      requestDto.requestedSlotEnd,
    );
  }

  @Patch(':id/accept-reschedule')
  async acceptReschedule(
    @Param() params: IdParamDto,
    @Query('doctorId') doctorId?: string,
  ) {
    if (!doctorId) {
      throw new BadRequestException('doctorId is required');
    }
    return await this.reservationsService.acceptReschedule(
      params.id,
      doctorId,
    );
  }

  @Patch(':id/decline-reschedule')
  async declineReschedule(
    @Param() params: IdParamDto,
    @Body() declineDto: ConfirmReservationDto,
    @Query('doctorId') doctorId?: string,
  ) {
    if (!doctorId) {
      throw new BadRequestException('doctorId is required');
    }
    return await this.reservationsService.declineReschedule(
      params.id,
      declineDto.message || 'Reschedule request declined',
      doctorId,
    );
  }

  @Post(':id/request-update')
  async requestUpdate(
    @Param() params: IdParamDto,
    @Body() requestDto: RequestUpdateDto,
  ) {
    return await this.reservationsService.requestUpdate(
      params.id,
      requestDto.message,
      requestDto.requestedSlotStart,
      requestDto.requestedSlotEnd,
      requestDto.requestedDoctorId,
      requestDto.requestedProcedureId,
      requestDto.requestedDepartmentId,
    );
  }

  @Patch(':id/accept-update')
  async acceptUpdate(
    @Param() params: IdParamDto,
    @Query('doctorId') doctorId?: string,
  ) {
    if (!doctorId) {
      throw new BadRequestException('doctorId is required');
    }
    return await this.reservationsService.acceptUpdate(
      params.id,
      doctorId,
    );
  }

  @Patch(':id/decline-update')
  async declineUpdate(
    @Param() params: IdParamDto,
    @Body() declineDto: ConfirmReservationDto,
    @Query('doctorId') doctorId?: string,
  ) {
    if (!doctorId) {
      throw new BadRequestException('doctorId is required');
    }
    return await this.reservationsService.declineUpdate(
      params.id,
      declineDto.message || 'Update request declined',
      doctorId,
    );
  }
}
