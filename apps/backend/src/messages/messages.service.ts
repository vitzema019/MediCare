import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from '../entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  async create(createMessageDto: CreateMessageDto, doctorId: string, patientId: string) {
    const messageData: any = {
      content: createMessageDto.content,
      senderType: createMessageDto.senderType,
      doctor: new Types.ObjectId(doctorId),
      patient: new Types.ObjectId(patientId),
      isRead: false,
    };

    if (createMessageDto.reservationId) {
      messageData.reservation = new Types.ObjectId(createMessageDto.reservationId);
    }

    if (createMessageDto.subject) {
      messageData.subject = createMessageDto.subject;
    }

    const message = await this.messageModel.create(messageData);
    return message;
  }

  async getConversation(doctorId: string, patientId: string) {
    const messages = await this.messageModel
      .find({
        doctor: new Types.ObjectId(doctorId),
        patient: new Types.ObjectId(patientId),
      })
      .sort({ createdAt: 1 })
      .lean();

    return messages.map(msg => ({
      id: msg._id.toString(),
      content: msg.content,
      senderType: msg.senderType,
      reservationId: msg.reservation?.toString(),
      subject: msg.subject,
      isRead: msg.isRead,
      createdAt: msg.createdAt?.toISOString(),
    }));
  }

  async getDoctorConversations(doctorId: string) {
    // Get all unique patients that have conversations with this doctor
    const conversations = await this.messageModel.aggregate([
      {
        $match: {
          doctor: new Types.ObjectId(doctorId),
        },
      },
      {
        $group: {
          _id: '$patient',
          lastMessage: { $max: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [{ $eq: ['$isRead', false] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'patients',
          localField: '_id',
          foreignField: '_id',
          as: 'patientInfo',
        },
      },
      {
        $unwind: {
          path: '$patientInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: { lastMessage: -1 },
      },
    ]);

    return conversations.map(conv => ({
      patientId: conv._id.toString(),
      patientName: conv.patientInfo
        ? `${conv.patientInfo.firstName} ${conv.patientInfo.lastName}`
        : 'Unknown Patient',
      unreadCount: conv.unreadCount,
      lastMessageTime: conv.lastMessage,
    }));
  }

  async getPatientConversations(patientId: string) {
    // Get all unique doctors that have conversations with this patient
    const conversations = await this.messageModel.aggregate([
      {
        $match: {
          patient: new Types.ObjectId(patientId),
        },
      },
      {
        $group: {
          _id: '$doctor',
          lastMessage: { $max: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [{ $eq: ['$isRead', false] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'doctors',
          localField: '_id',
          foreignField: '_id',
          as: 'doctorInfo',
        },
      },
      {
        $unwind: {
          path: '$doctorInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: { lastMessage: -1 },
      },
    ]);

    return conversations.map(conv => ({
      doctorId: conv._id.toString(),
      doctorName: conv.doctorInfo
        ? `Dr. ${conv.doctorInfo.firstName} ${conv.doctorInfo.lastName}`
        : 'Unknown Doctor',
      unreadCount: conv.unreadCount,
      lastMessageTime: conv.lastMessage,
    }));
  }

  async markAsRead(messageId: string) {
    await this.messageModel.findByIdAndUpdate(messageId, { isRead: true });
  }
}



