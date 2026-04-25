import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Electrician } from '../../database/entities/electrician.entity';
import { Dealer } from '../../database/entities/dealer.entity';
import { Scan } from '../../database/entities/scan.entity';
import { Redemption } from '../../database/entities/redemption.entity';
import { Wallet } from '../../database/entities/wallet.entity';
import { UserRole, RedemptionStatus, UserStatus } from '../../common/enums';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Electrician)
    private electricianRepository: Repository<Electrician>,
    @InjectRepository(Dealer)
    private dealerRepository: Repository<Dealer>,
    @InjectRepository(Scan)
    private scanRepository: Repository<Scan>,
    @InjectRepository(Redemption)
    private redemptionRepository: Repository<Redemption>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
  ) {}

  async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const [
      totalElectricians,
      totalDealers,
      activeElectricians,
      activeDealers,
      totalScansToday,
      totalScansYesterday,
      totalPointsAwarded,
      pendingRedemptions,
      totalRedemptions,
    ] = await Promise.all([
      this.electricianRepository.count(),
      this.dealerRepository.count(),
      this.electricianRepository.count({ where: { status: UserStatus.ACTIVE } }),
      this.dealerRepository.count({ where: { status: UserStatus.ACTIVE } }),
      this.scanRepository.count({
        where: { scannedAt: Between(today, new Date()) },
      }),
      this.scanRepository.count({
        where: { scannedAt: Between(yesterday, today) },
      }),
      this.electricianRepository
        .createQueryBuilder('electrician')
        .select('SUM(electrician.totalPoints)', 'total')
        .getRawOne(),
      this.redemptionRepository.count({
        where: { status: RedemptionStatus.PENDING },
      }),
      this.redemptionRepository.count(),
    ]);

    const growthRate = totalScansYesterday > 0 
      ? ((totalScansToday - totalScansYesterday) / totalScansYesterday) * 100 
      : 0;

    return {
      totalElectricians,
      totalDealers,
      activeUsers: activeElectricians + activeDealers,
      totalScansToday,
      totalPointsAwarded: parseInt(totalPointsAwarded?.total || '0'),
      pendingRedemptions,
      totalRedemptions,
      growthRate: Math.round(growthRate * 100) / 100,
    };
  }

  async getScans() {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [electricianScans, dealerScans] = await Promise.all([
        this.scanRepository.count({
          where: {
            role: UserRole.ELECTRICIAN,
            scannedAt: Between(date, nextDate),
          },
        }),
        this.scanRepository.count({
          where: {
            role: UserRole.DEALER,
            scannedAt: Between(date, nextDate),
          },
        }),
      ]);

      last7Days.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.toISOString().split('T')[0],
        electrician: electricianScans,
        dealer: dealerScans,
        total: electricianScans + dealerScans,
      });
    }

    return {
      last7Days,
      totalScans: last7Days.reduce((sum, day) => sum + day.total, 0),
    };
  }

  async getUsers() {
    const tierDistribution = await this.electricianRepository
      .createQueryBuilder('electrician')
      .select('electrician.tier', 'tier')
      .addSelect('COUNT(*)', 'count')
      .groupBy('electrician.tier')
      .getRawMany();

    const userGrowth = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [newElectricians, newDealers] = await Promise.all([
        this.electricianRepository.count({
          where: { joinedDate: Between(date, nextDate) },
        }),
        this.dealerRepository.count({
          where: { joinedDate: Between(date, nextDate) },
        }),
      ]);

      userGrowth.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.toISOString().split('T')[0],
        electricians: newElectricians,
        dealers: newDealers,
        total: newElectricians + newDealers,
      });
    }

    return {
      tierDistribution,
      userGrowth,
    };
  }

  async getRevenue() {
    const totalWalletBalance = await this.walletRepository
      .createQueryBuilder('wallet')
      .select('SUM(wallet.amount)', 'total')
      .where('wallet.type = :type', { type: 'credit' })
      .getRawOne();

    const totalRedemptions = await this.redemptionRepository
      .createQueryBuilder('redemption')
      .select('SUM(redemption.amount)', 'total')
      .where('redemption.status = :status', { status: RedemptionStatus.COMPLETED })
      .getRawOne();

    const monthlyRevenue = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

      const monthRedemptions = await this.redemptionRepository
        .createQueryBuilder('redemption')
        .select('SUM(redemption.amount)', 'total')
        .where('redemption.status = :status', { status: RedemptionStatus.COMPLETED })
        .andWhere('redemption.requestedAt >= :start', { start: date })
        .andWhere('redemption.requestedAt < :end', { end: nextMonth })
        .getRawOne();

      monthlyRevenue.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount: parseFloat(monthRedemptions?.total || '0'),
      });
    }

    return {
      totalWalletBalance: parseFloat(totalWalletBalance?.total || '0'),
      totalRedemptions: parseFloat(totalRedemptions?.total || '0'),
      monthlyRevenue,
    };
  }
}