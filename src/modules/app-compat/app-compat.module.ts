import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppCompatController } from './app-compat.controller';
import { AppCompatService } from './app-compat.service';
import { MobileAuthModule } from '../mobile-auth/mobile-auth.module';
import { Dealer } from '../../database/entities/dealer.entity';
import { Electrician } from '../../database/entities/electrician.entity';
import { Product } from '../../database/entities/product.entity';
import { ProductCategory } from '../../database/entities/product-category.entity';
import { RewardScheme } from '../../database/entities/reward-scheme.entity';
import { Offer } from '../../database/entities/offer.entity';
import { Settings } from '../../database/entities/settings.entity';
import { Festival } from '../../database/entities/festival.entity';
import { Testimonial } from '../../database/entities/testimonial.entity';
import { Notification } from '../../database/entities/notification.entity';
import { SupportTicket } from '../../database/entities/support-ticket.entity';
import { UserProfileImage } from '../../database/entities/user-profile-image.entity';
import { UserQrCode } from '../../database/entities/user-qr-code.entity';
import { AppRating } from '../../database/entities/app-rating.entity';
import { Wallet } from '../../database/entities/wallet.entity';
import { Redemption } from '../../database/entities/redemption.entity';
import { Scan } from '../../database/entities/scan.entity';
import { QrCode } from '../../database/entities/qr-code.entity';
import { OtpCode } from '../../database/entities/otp-code.entity';

@Module({
  imports: [
    ConfigModule,
    MobileAuthModule,
    TypeOrmModule.forFeature([
      Dealer,
      Electrician,
      Product,
      ProductCategory,
      RewardScheme,
      Offer,
      Settings,
      Festival,
      Testimonial,
      Notification,
      SupportTicket,
      UserProfileImage,
      UserQrCode,
      AppRating,
      Wallet,
      Redemption,
      Scan,
      QrCode,
      OtpCode,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN') || '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppCompatController],
  providers: [AppCompatService],
})
export class AppCompatModule {}
