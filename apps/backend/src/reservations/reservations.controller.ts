import { Body, Controller, Delete, Get, Param, Patch, Post, Query, BadRequestException, UseGuards } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CreateReservationResponseDto } from './dto/create-reservation.response';
import { IdParamDto } from './dto/id-param.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ConfirmReservationDto } from './dto/confirm-reservation.dto';
import { RequestCancellationDto } from './dto/request-cancellation.dto';
import { RequestRescheduleDto } from './dto/request-reschedule.dto';
import { RequestUpdateDto } from './dto/request-update.dto';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) { }

  @Get()
  async findAll(
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    if (doctorId) {
      // Get reservations for a specific doctor
      return this.reservationsService.findByDoctor(doctorId);
    }
    // Use patientId from query or from authenticated user
    const targetPatientId = patientId || user?.sub;
    if (!targetPatientId) {
      throw new BadRequestException('patientId is required');
    }
    return this.reservationsService.findAll(targetPatientId);
  }

  @Post()
  async create(
    @Body() dto: CreateReservationDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<CreateReservationResponseDto> {
    const currentUser = { id: user.sub, patientId: user.sub };
    return this.reservationsService.create(dto, currentUser);
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

  @UseGuards(RolesGuard)
  @Roles('doctor')
  @Post(':id/confirm')
  async confirmReservation(
    @Param() params: IdParamDto,
    @Body() confirmDto: ConfirmReservationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.reservationsService.confirmReservation(
      params.id,
      confirmDto.status,
      confirmDto.message,
      user.sub,
    );
  }

  @UseGuards(RolesGuard)
  @Roles('patient')
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

  @UseGuards(RolesGuard)
  @Roles('doctor')
  @Patch(':id/accept-cancellation')
  async acceptCancellation(
    @Param() params: IdParamDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.reservationsService.acceptCancellation(
      params.id,
      user.sub,
    );
  }

  @UseGuards(RolesGuard)
  @Roles('doctor')
  @Patch(':id/decline-cancellation')
  async declineCancellation(
    @Param() params: IdParamDto,
    @Body() declineDto: ConfirmReservationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.reservationsService.declineCancellation(
      params.id,
      declineDto.message || 'Cancellation request declined',
      user.sub,
    );
  }

  @UseGuards(RolesGuard)
  @Roles('patient')
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

  @UseGuards(RolesGuard)
  @Roles('doctor')
  @Patch(':id/accept-reschedule')
  async acceptReschedule(
    @Param() params: IdParamDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.reservationsService.acceptReschedule(
      params.id,
      user.sub,
    );
  }

  @UseGuards(RolesGuard)
  @Roles('doctor')
  @Patch(':id/decline-reschedule')
  async declineReschedule(
    @Param() params: IdParamDto,
    @Body() declineDto: ConfirmReservationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.reservationsService.declineReschedule(
      params.id,
      declineDto.message || 'Reschedule request declined',
      user.sub,
    );
  }

  @UseGuards(RolesGuard)
  @Roles('patient')
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

  @UseGuards(RolesGuard)
  @Roles('doctor')
  @Patch(':id/accept-update')
  async acceptUpdate(
    @Param() params: IdParamDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.reservationsService.acceptUpdate(
      params.id,
      user.sub,
    );
  }

  @UseGuards(RolesGuard)
  @Roles('doctor')
  @Patch(':id/decline-update')
  async declineUpdate(
    @Param() params: IdParamDto,
    @Body() declineDto: ConfirmReservationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.reservationsService.declineUpdate(
      params.id,
      declineDto.message || 'Update request declined',
      user.sub,
    );
  }
}
