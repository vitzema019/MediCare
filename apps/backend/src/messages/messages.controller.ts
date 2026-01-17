import { Controller, Get, Post, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  async create(
    @Body() createMessageDto: CreateMessageDto,
    @Query('doctorId') doctorId?: string,
    @Query('patientId') patientId?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    // Use query params or fall back to authenticated user ID based on role
    const docId = doctorId || (user?.role === 'doctor' ? user.sub : undefined);
    const patId = patientId || (user?.role === 'patient' ? user.sub : undefined);

    if (!docId || !patId) {
      throw new BadRequestException('doctorId and patientId are required');
    }

    return this.messagesService.create(createMessageDto, docId, patId);
  }

  @Get('conversation')
  async getConversation(@Query('doctorId') doctorId: string, @Query('patientId') patientId: string) {
    return this.messagesService.getConversation(doctorId, patientId);
  }

  @Get('doctor/:doctorId')
  async getDoctorConversations(@Param('doctorId') doctorId: string) {
    return this.messagesService.getDoctorConversations(doctorId);
  }

  @Get('patient/:patientId')
  async getPatientConversations(@Param('patientId') patientId: string) {
    return this.messagesService.getPatientConversations(patientId);
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string) {
    await this.messagesService.markAsRead(id);
    return { success: true };
  }
}
