import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DealerController } from './dealer.controller';
import { DealerService } from './dealer.service';
import { Dealer } from '../../database/entities/dealer.entity';
import { Electrician } from '../../database/entities/electrician.entity';
import { Wallet } from '../../database/entities/wallet.entity';
import { TierModule } from '../../common/services/tier.module';

@Module({
  imports: [TypeOrmModule.forFeature([Dealer, Electrician, Wallet]), TierModule],
  controllers: [DealerController],
  providers: [DealerService],
  exports: [DealerService],
})
export class DealerModule {}