import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';

// TODO: Replace with real auth decorator
const mockCurrentDoctor = { id: 'DOC-1' };
const mockCurrentPatient = { id: 'PAT-1' };

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  async create(@Body() createMessageDto: CreateMessageDto, @Query('doctorId') doctorId?: string, @Query('patientId') patientId?: string) {
    // TODO: Get from auth context
    const docId = doctorId || mockCurrentDoctor.id;
    const patId = patientId || mockCurrentPatient.id;
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



