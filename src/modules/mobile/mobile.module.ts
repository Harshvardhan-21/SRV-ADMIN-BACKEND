import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MobileController } from './mobile.controller';
import { MobileService } from './mobile.service';
import { MobileAuthModule } from '../mobile-auth/mobile-auth.module';
import { Product } from '../../database/entities/product.entity';
import { ProductCategory } from '../../database/entities/product-category.entity';
import { Banner } from '../../database/entities/banner.entity';
import { Notification } from '../../database/entities/notification.entity';
import { Offer } from '../../database/entities/offer.entity';
import { Testimonial } from '../../database/entities/testimonial.entity';
import { QrCode } from '../../database/entities/qr-code.entity';
import { Scan } from '../../database/entities/scan.entity';
import { Wallet } from '../../database/entities/wallet.entity';
import { Electrician } from '../../database/entities/electrician.entity';
import { Dealer } from '../../database/entities/dealer.entity';
import { Redemption } from '../../database/entities/redemption.entity';
import { Settings } from '../../database/entities/settings.entity';
import { Festival } from '../../database/entities/festival.entity';
import { SupportTicket } from '../../database/entities/support-ticket.entity';
import { AppRating } from '../../database/entities/app-rating.entity';
import { RewardScheme } from '../../database/entities/reward-scheme.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product, ProductCategory, Banner, Notification, Offer, Testimonial,
      QrCode, Scan, Wallet, Electrician, Dealer, Redemption, Settings, Festival,
      SupportTicket, AppRating, RewardScheme,
    ]),
    MobileAuthModule,
  ],
  controllers: [MobileController],
  providers: [MobileService],
})
export class MobileModule {}
