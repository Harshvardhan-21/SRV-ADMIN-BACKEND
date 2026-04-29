import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiftController } from './gift.controller';
import { GiftService } from './gift.service';
import { Product } from '../../database/entities/product.entity';
import { GiftOrder } from '../../database/entities/gift-order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, GiftOrder])],
  controllers: [GiftController],
  providers: [GiftService],
  exports: [GiftService],
})
export class GiftModule {}
