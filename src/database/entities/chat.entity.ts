import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ChatParticipantType, ChatMessageType } from '../../common/enums';

@Entity('chat_conversations')
export class ChatConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  lastMessageId: string;

  @Column({ type: 'text', nullable: true })
  lastMessage: string;

  @Column({ nullable: true })
  lastMessageAt: Date;

  @Column({ default: 0 })
  unreadAdminCount: number;

  @Column({ default: 0 })
  unreadUserCount: number;

  @Column({
    type: 'enum',
    enum: ChatParticipantType,
    default: ChatParticipantType.USER,
  })
  participantType: ChatParticipantType;

  @Column({ nullable: true })
  participantId: string;

  @Column({ nullable: true })
  participantName: string;

  @Column({ nullable: true })
  participantDeviceToken: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  conversationId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: ChatParticipantType,
    default: ChatParticipantType.USER,
  })
  senderType: ChatParticipantType;

  @Column({ nullable: true })
  senderId: string;

  @Column({ nullable: true })
  senderName: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  readAt: Date;

  @Column({
    type: 'enum',
    enum: ChatMessageType,
    default: ChatMessageType.TEXT,
  })
  messageType: ChatMessageType;

  @Column({ nullable: true })
  attachmentUrl: string;

  @Column({ nullable: true })
  metadata: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}