import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto';
import { ChatParticipantType } from '../../common/enums';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userType?: ChatParticipantType;
  userName?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedClients: Map<string, string> = new Map();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      
      client.userId = payload.sub || payload.id || payload.userId;
      client.userType = payload.role === 'super_admin' || payload.role === 'admin' || payload.role === 'staff' 
        ? ChatParticipantType.ADMIN 
        : ChatParticipantType.USER;
      client.userName = payload.name || payload.username || 'User';

      this.connectedClients.set(client.userId, client.id);
      client.join(`user:${client.userId}`);
      client.join(`type:${client.userType}`);

      this.logger.log(`Client connected: ${client.userId} (${client.userType})`);
      
      client.emit('connected', { 
        userId: client.userId, 
        userType: client.userType,
        socketId: client.id 
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.emit('error', { message: 'Invalid token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedClients.delete(client.userId);
      this.logger.log(`Client disconnected: ${client.userId}`);
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: CreateMessageDto,
  ): Promise<WsResponse> {
    try {
      if (!client.userId) {
        return { event: 'error', data: { message: 'Not authenticated' } };
      }

      const message = await this.chatService.createMessage({
        ...data,
        senderId: client.userId,
        senderType: client.userType,
        senderName: client.userName,
      });

      if (data.conversationId) {
        const conversation = await this.chatService.getConversation(data.conversationId);
        
        if (conversation.participantType === ChatParticipantType.USER && conversation.participantId) {
          const userSocketId = this.connectedClients.get(conversation.participantId);
          if (userSocketId) {
            this.server.to(userSocketId).emit('new_message', message);
          }
        }
        
        this.server.to('type:admin').emit('new_message', message);
      } else {
        const userSocketId = this.connectedClients.get(data.recipientId);
        if (userSocketId) {
          this.server.to(userSocketId).emit('new_message', message);
        }
      }

      return { event: 'message_sent', data: message };
    } catch (error) {
      this.logger.error(`Send message error: ${error.message}`);
      return { event: 'error', data: { message: error.message } };
    }
  }

  @SubscribeMessage('get_conversations')
  async handleGetConversations(
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<WsResponse> {
    try {
      if (!client.userId) {
        return { event: 'error', data: { message: 'Not authenticated' } };
      }

      const conversations = await this.chatService.getConversations(
        client.userId,
        client.userType,
      );

      return { event: 'conversations', data: conversations };
    } catch (error) {
      this.logger.error(`Get conversations error: ${error.message}`);
      return { event: 'error', data: { message: error.message } };
    }
  }

  @SubscribeMessage('get_messages')
  async handleGetMessages(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; page?: number; limit?: number },
  ): Promise<WsResponse> {
    try {
      if (!client.userId) {
        return { event: 'error', data: { message: 'Not authenticated' } };
      }

      const messages = await this.chatService.getMessages(
        data.conversationId,
        data.page || 1,
        data.limit || 50,
      );

      return { event: 'messages', data: messages };
    } catch (error) {
      this.logger.error(`Get messages error: ${error.message}`);
      return { event: 'error', data: { message: error.message } };
    }
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string },
  ): Promise<WsResponse> {
    try {
      if (!client.userId) {
        return { event: 'error', data: { message: 'Not authenticated' } };
      }

      const message = await this.chatService.markMessageRead(data.messageId);

      return { event: 'message_read', data: message };
    } catch (error) {
      this.logger.error(`Mark read error: ${error.message}`);
      return { event: 'error', data: { message: error.message } };
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ): Promise<WsResponse> {
    try {
      if (!client.userId) {
        return { event: 'error', data: { message: 'Not authenticated' } };
      }

      const conversation = await this.chatService.getConversation(data.conversationId);
      
      const recipientId = conversation?.participantId;
      if (recipientId) {
        const recipientSocketId = this.connectedClients.get(recipientId);
        if (recipientSocketId) {
          this.server.to(recipientSocketId).emit('user_typing', {
            userId: client.userId,
            userName: client.userName,
            isTyping: data.isTyping,
          });
        }
      }

      return { event: 'typing_ack', data: { received: true } };
    } catch (error) {
      this.logger.error(`Typing error: ${error.message}`);
      return { event: 'error', data: { message: error.message } };
    }
  }

  emitToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedClients.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
    }
  }

  emitToAdmins(event: string, data: any) {
    this.server.to('type:admin').emit(event, data);
  }

  emitToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  @SubscribeMessage('sync_request')
  async handleSyncRequest(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { type?: string },
  ): Promise<WsResponse> {
    try {
      if (!client.userId) {
        return { event: 'error', data: { message: 'Not authenticated' } };
      }

      return { event: 'sync_response', data: { type: data.type || 'full', timestamp: new Date() } };
    } catch (error) {
      this.logger.error(`Sync request error: ${error.message}`);
      return { event: 'error', data: { message: error.message } };
    }
  }

  @SubscribeMessage('subscribe_updates')
  async handleSubscribeUpdates(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { types: string[] },
  ): Promise<WsResponse> {
    try {
      if (!client.userId) {
        return { event: 'error', data: { message: 'Not authenticated' } };
      }

      for (const type of data.types) {
        client.join(`updates:${type}`);
      }

      return { event: 'subscribed', data: { types: data.types } };
    } catch (error) {
      this.logger.error(`Subscribe updates error: ${error.message}`);
      return { event: 'error', data: { message: error.message } };
    }
  }

  emitUserUpdate(userId: string, updateType: string, data: any) {
    const socketId = this.connectedClients.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('user_updated', {
        updateType,
        data,
        timestamp: new Date(),
      });
    }
  }

  emitOfferUpdate(offerId: string, action: 'create' | 'update' | 'delete', data: any) {
    this.server.emit('offer_updated', {
      action,
      offerId,
      data,
      timestamp: new Date(),
    });
    this.server.to('updates:offers').emit('offer_updated', {
      action,
      offerId,
      data,
      timestamp: new Date(),
    });
  }

  emitBannerUpdate(bannerId: string, action: 'create' | 'update' | 'delete', data: any) {
    this.server.emit('banner_updated', {
      action,
      bannerId,
      data,
      timestamp: new Date(),
    });
    this.server.to('updates:banners').emit('banner_updated', {
      action,
      bannerId,
      data,
      timestamp: new Date(),
    });
  }

  emitSettingsUpdate(settingKey: string, value: any) {
    this.server.emit('settings_updated', {
      key: settingKey,
      value,
      timestamp: new Date(),
    });
    this.server.to('updates:settings').emit('settings_updated', {
      key: settingKey,
      value,
      timestamp: new Date(),
    });
  }

  emitAnnouncement(title: string, message: string, data?: any) {
    this.server.emit('announcement', {
      title,
      message,
      data,
      timestamp: new Date(),
    });
  }

  emitNotification(userId: string, notification: any) {
    const socketId = this.connectedClients.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('notification', {
        ...notification,
        timestamp: new Date(),
      });
    }
  }
}