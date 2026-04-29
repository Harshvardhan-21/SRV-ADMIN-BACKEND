import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatConversation, ChatMessage } from '../../database/entities/chat.entity';
import { ChatParticipantType } from '../../common/enums';
import { CreateConversationDto, CreateMessageDto } from './dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(ChatConversation)
    private readonly conversationRepo: Repository<ChatConversation>,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
  ) {}

  async createConversation(data: CreateConversationDto): Promise<ChatConversation> {
    const conversation = this.conversationRepo.create({
      participantType: data.participantType || ChatParticipantType.USER,
      participantId: data.participantId,
      participantName: data.participantName,
      participantDeviceToken: data.participantDeviceToken,
      title: data.title,
    });

    return this.conversationRepo.save(conversation);
  }

  async getConversation(id: string): Promise<ChatConversation> {
    const conversation = await this.conversationRepo.findOne({ where: { id } });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }

  async getConversations(
    userId: string,
    userType: ChatParticipantType,
    page = 1,
    limit = 20,
  ): Promise<{ conversations: ChatConversation[]; total: number }> {
    const skip = (page - 1) * limit;

    const [conversations, total] = await this.conversationRepo.findAndCount({
      where: userType === ChatParticipantType.ADMIN 
        ? {} 
        : { participantId: userId },
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { conversations, total };
  }

  async findOrCreateConversation(
    participantId: string,
    participantType: ChatParticipantType,
    participantName?: string,
  ): Promise<ChatConversation> {
    let conversation = await this.conversationRepo.findOne({
      where: { participantId, participantType },
    });

    if (!conversation) {
      conversation = await this.createConversation({
        participantId,
        participantType,
        participantName,
      });
    }

    return conversation;
  }

  async createMessage(data: CreateMessageDto): Promise<ChatMessage> {
    let conversationId = data.conversationId;

    if (!conversationId && data.recipientId) {
      const conversation = await this.findOrCreateConversation(
        data.recipientId,
        ChatParticipantType.USER,
        data.recipientName,
      );
      conversationId = conversation.id;
    }

    if (!conversationId) {
      throw new NotFoundException('Conversation ID or recipient ID required');
    }

    const message = this.messageRepo.create({
      conversationId,
      content: data.content,
      senderId: data.senderId,
      senderType: data.senderType,
      senderName: data.senderName,
      messageType: data.messageType,
      attachmentUrl: data.attachmentUrl,
      metadata: data.metadata,
    });

    const savedMessage = await this.messageRepo.save(message);

    await this.conversationRepo.update(conversationId, {
      lastMessageId: savedMessage.id,
      lastMessage: data.content.substring(0, 100),
      lastMessageAt: new Date(),
    });

    if (data.senderType === ChatParticipantType.ADMIN) {
      await this.conversationRepo.increment(
        { id: conversationId },
        'unreadUserCount',
        1,
      );
    } else {
      await this.conversationRepo.increment(
        { id: conversationId },
        'unreadAdminCount',
        1,
      );
    }

    return savedMessage;
  }

  async getMessages(
    conversationId: string,
    page = 1,
    limit = 50,
  ): Promise<{ messages: ChatMessage[]; total: number }> {
    const skip = (page - 1) * limit;

    const [messages, total] = await this.messageRepo.findAndCount({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { messages: messages.reverse(), total };
  }

  async markMessageRead(messageId: string): Promise<ChatMessage> {
    const message = await this.messageRepo.findOne({ where: { id: messageId } });
    
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (!message.isRead) {
      await this.messageRepo.update(messageId, { isRead: true, readAt: new Date() });
      
      if (message.senderType === ChatParticipantType.ADMIN) {
        await this.conversationRepo.decrement(
          { id: message.conversationId },
          'unreadUserCount',
          1,
        );
      } else {
        await this.conversationRepo.decrement(
          { id: message.conversationId },
          'unreadAdminCount',
          1,
        );
      }
    }

    return this.messageRepo.findOne({ where: { id: messageId } });
  }

  async markAllRead(conversationId: string, userType: ChatParticipantType): Promise<void> {
    const messages = await this.messageRepo.find({
      where: { conversationId, isRead: false },
    });

    for (const message of messages) {
      if (message.senderType !== userType) {
        await this.markMessageRead(message.id);
      }
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.messageRepo.delete(messageId);
  }

  async getUnreadCount(userId: string, userType: ChatParticipantType): Promise<number> {
    if (userType === ChatParticipantType.ADMIN) {
      const result = await this.conversationRepo
        .createQueryBuilder('conversation')
        .select('SUM(conversation.unreadAdminCount)', 'total')
        .getRawOne();
      return result?.total || 0;
    } else {
      const result = await this.conversationRepo
        .createQueryBuilder('conversation')
        .select('SUM(conversation.unreadUserCount)', 'total')
        .where('conversation.participantId = :userId', { userId })
        .getRawOne();
      return result?.total || 0;
    }
  }
}