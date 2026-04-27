import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChatParticipantType, ChatMessageType } from '../../../common/enums';

export class CreateConversationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  participantId?: string;

  @ApiPropertyOptional({ enum: ChatParticipantType })
  @IsOptional()
  @IsEnum(ChatParticipantType)
  participantType?: ChatParticipantType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  participantName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  participantDeviceToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;
}

export class CreateMessageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recipientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recipientName?: string;

  @ApiPropertyOptional({ enum: ChatMessageType })
  @IsOptional()
  @IsEnum(ChatMessageType)
  messageType?: ChatMessageType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metadata?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  senderId?: string;

  @ApiPropertyOptional({ enum: ChatParticipantType })
  @IsOptional()
  @IsEnum(ChatParticipantType)
  senderType?: ChatParticipantType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  senderName?: string;
}

export class GetConversationsDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number;
}

export class GetMessagesDto {
  @ApiProperty()
  @IsString()
  conversationId: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  limit?: number;
}

export class MarkReadDto {
  @ApiProperty()
  @IsString()
  messageId: string;
}