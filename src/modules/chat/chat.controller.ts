import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import {
  CreateConversationDto,
  CreateMessageDto,
  GetConversationsDto,
  GetMessagesDto,
  MarkReadDto,
} from './dto';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({ status: 201, description: 'Conversation created' })
  async createConversation(@Body() dto: CreateConversationDto) {
    return this.chatService.createConversation(dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations' })
  @ApiResponse({ status: 200, description: 'List of conversations' })
  async getConversations(
    @Query() query: GetConversationsDto,
    @Body('userId') userId: string,
    @Body('userType') userType: string,
  ) {
    return this.chatService.getConversations(
      userId,
      userType as any,
      query.page,
      query.limit,
    );
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a conversation by ID' })
  @ApiResponse({ status: 200, description: 'Conversation details' })
  async getConversation(@Param('id') id: string) {
    return this.chatService.getConversation(id);
  }

  @Post('conversations/:participantId/start')
  @ApiOperation({ summary: 'Start or get conversation with a participant' })
  @ApiResponse({ status: 200, description: 'Conversation found or created' })
  async startConversation(
    @Param('participantId') participantId: string,
    @Body('participantName') participantName?: string,
  ) {
    return this.chatService.findOrCreateConversation(
      participantId,
      'user' as any,
      participantName,
    );
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(@Body() dto: CreateMessageDto) {
    return this.chatService.createMessage(dto);
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Get messages for a conversation' })
  @ApiResponse({ status: 200, description: 'List of messages' })
  async getMessages(@Param('conversationId') conversationId: string, @Query() query: GetConversationsDto) {
    return this.chatService.getMessages(conversationId, query.page, query.limit);
  }

  @Put('messages/:messageId/read')
  @ApiOperation({ summary: 'Mark message as read' })
  @ApiResponse({ status: 200, description: 'Message marked as read' })
  async markRead(@Param('messageId') messageId: string) {
    return this.chatService.markMessageRead(messageId);
  }

  @Put('conversations/:conversationId/read-all')
  @ApiOperation({ summary: 'Mark all messages in conversation as read' })
  @ApiResponse({ status: 200, description: 'All messages marked as read' })
  async markAllRead(
    @Param('conversationId') conversationId: string,
    @Body('userType') userType: string,
  ) {
    await this.chatService.markAllRead(conversationId, userType as any);
    return { success: true };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread message count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  async getUnreadCount(
    @Body('userId') userId: string,
    @Body('userType') userType: string,
  ) {
    const count = await this.chatService.getUnreadCount(userId, userType as any);
    return { unreadCount: count };
  }

  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: 200, description: 'Message deleted' })
  @HttpCode(HttpStatus.OK)
  async deleteMessage(@Param('messageId') messageId: string) {
    await this.chatService.deleteMessage(messageId);
    return { success: true };
  }
}