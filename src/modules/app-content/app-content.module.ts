import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardScheme } from '../../database/entities/reward-scheme.entity';
import { Festival } from '../../database/entities/festival.entity';
import { AppContentController } from './app-content.controller';
import { AppContentService } from './app-content.service';

@Module({
  imports: [TypeOrmModule.forFeature([RewardScheme, Festival])],
  controllers: [AppContentController],
  providers: [AppContentService],
  exports: [AppContentService],
})
export class AppContentModule {}
