import { Injectable, Logger } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';

export type UpdateType = 'user' | 'offer' | 'banner' | 'settings' | 'notification' | 'announcement';

export interface SyncPayload {
  type: UpdateType;
  action: 'create' | 'update' | 'delete';
  entityId?: string;
  data?: any;
  timestamp: Date;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(private readonly chatGateway: ChatGateway) {}

  syncUserUpdate(userId: string, data: any) {
    this.logger.log(`Syncing user update for ${userId}`);
    this.chatGateway.emitUserUpdate(userId, 'user', {
      type: 'user',
      action: 'update',
      data,
      timestamp: new Date(),
    });
  }

  syncOfferUpdate(offerId: string, action: 'create' | 'update' | 'delete', data: any) {
    this.logger.log(`Syncing offer ${action} for ${offerId}`);
    this.chatGateway.emitOfferUpdate(offerId, action, data);
  }

  syncBannerUpdate(bannerId: string, action: 'create' | 'update' | 'delete', data: any) {
    this.logger.log(`Syncing banner ${action} for ${bannerId}`);
    this.chatGateway.emitBannerUpdate(bannerId, action, data);
  }

  syncSettingsUpdate(key: string, value: any) {
    this.logger.log(`Syncing settings update for key ${key}`);
    this.chatGateway.emitSettingsUpdate(key, value);
  }

  syncNotification(userId: string, notification: {
    id?: string;
    title: string;
    body?: string;
    type?: string;
    data?: any;
  }) {
    this.logger.log(`Syncing notification for ${userId}`);
    this.chatGateway.emitNotification(userId, notification);
  }

  broadcastAnnouncement(title: string, message: string, data?: any) {
    this.logger.log(`Broadcasting announcement: ${title}`);
    this.chatGateway.emitAnnouncement(title, message, data);
  }

  syncToUser(userId: string, event: string, data: any) {
    this.chatGateway.emitToUser(userId, event, data);
  }

  syncToAll(event: string, data: any) {
    this.chatGateway.emitToAll(event, data);
  }

  syncToAdmins(event: string, data: any) {
    this.chatGateway.emitToAdmins(event, data);
  }
}