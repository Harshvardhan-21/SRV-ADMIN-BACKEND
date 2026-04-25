import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../../database/entities/wallet.entity';
import { Redemption } from '../../database/entities/redemption.entity';
import { Dealer } from '../../database/entities/dealer.entity';
import { Electrician } from '../../database/entities/electrician.entity';
import { TransactionType, TransactionSource, UserRole, RedemptionStatus } from '../../common/enums';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Redemption)
    private redemptionRepository: Repository<Redemption>,
    @InjectRepository(Dealer)
    private dealerRepository: Repository<Dealer>,
    @InjectRepository(Electrician)
    private electricianRepository: Repository<Electrician>,
  ) {}

  async getSummary() {
    const [
      totalCredits,
      totalDebits,
      totalRedemptions,
      pendingRedemptions,
      electricianWalletBalance,
      dealerWalletBalance,
    ] = await Promise.all([
      this.walletRepository
        .createQueryBuilder('wallet')
        .select('SUM(wallet.amount)', 'total')
        .where('wallet.type = :type', { type: TransactionType.CREDIT })
        .getRawOne(),
      this.walletRepository
        .createQueryBuilder('wallet')
        .select('SUM(wallet.amount)', 'total')
        .where('wallet.type = :type', { type: TransactionType.DEBIT })
        .getRawOne(),
      this.redemptionRepository
        .createQueryBuilder('redemption')
        .select('SUM(redemption.amount)', 'total')
        .where('redemption.status = :status', { status: RedemptionStatus.COMPLETED })
        .getRawOne(),
      this.redemptionRepository.count({
        where: { status: RedemptionStatus.PENDING },
      }),
      this.electricianRepository
        .createQueryBuilder('electrician')
        .select('SUM(electrician.walletBalance)', 'total')
        .getRawOne(),
      this.dealerRepository
        .createQueryBuilder('dealer')
        .select('SUM(dealer.walletBalance)', 'total')
        .getRawOne(),
    ]);

    return {
      totalCredits: parseFloat(totalCredits?.total || '0'),
      totalDebits: parseFloat(totalDebits?.total || '0'),
      totalRedemptions: parseFloat(totalRedemptions?.total || '0'),
      pendingRedemptions,
      electricianWalletBalance: parseFloat(electricianWalletBalance?.total || '0'),
      dealerWalletBalance: parseFloat(dealerWalletBalance?.total || '0'),
      netBalance: parseFloat(totalCredits?.total || '0') - parseFloat(totalDebits?.total || '0'),
    };
  }

  async getTransactions(
    page: number = 1,
    limit: number = 20,
    type?: TransactionType,
    userRole?: UserRole,
  ) {
    const skip = (page - 1) * limit;
    const queryBuilder = this.walletRepository.createQueryBuilder('wallet');

    if (type) {
      queryBuilder.andWhere('wallet.type = :type', { type });
    }

    if (userRole) {
      queryBuilder.andWhere('wallet.userRole = :userRole', { userRole });
    }

    queryBuilder
      .orderBy('wallet.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDealerBonus() {
    const dealers = await this.dealerRepository.find({
      select: ['id', 'name', 'walletBalance', 'monthlyTarget', 'achievedTarget'],
    });

    const bonusData = dealers.map(dealer => ({
      ...dealer,
      bonusEligible: (dealer.achievedTarget || 0) >= (dealer.monthlyTarget || 0),
      bonusAmount: Math.max(0, (dealer.achievedTarget || 0) - (dealer.monthlyTarget || 0)) * 0.1, // 10% bonus
    }));

    return {
      dealers: bonusData,
      totalBonusAmount: bonusData.reduce((sum, d) => sum + d.bonusAmount, 0),
    };
  }

  async transferDealerBonus(
    transferData: { dealerId: string; amount: number; description?: string },
    adminId: string,
  ) {
    const { dealerId, amount, description } = transferData;

    // Create wallet transaction
    const transaction = this.walletRepository.create({
      userId: dealerId,
      userRole: UserRole.DEALER,
      type: TransactionType.CREDIT,
      source: TransactionSource.BONUS,
      amount,
      balanceBefore: 0, // Will be updated
      balanceAfter: 0, // Will be updated
      description: description || 'Dealer bonus transfer',
      referenceId: adminId,
      referenceType: 'admin_transfer',
    });

    // Get current balance and update
    const dealer = await this.dealerRepository.findOne({ where: { id: dealerId } });
    if (dealer) {
      const currentBalance = dealer.walletBalance || 0;
      const newBalance = currentBalance + amount;

      transaction.balanceBefore = currentBalance;
      transaction.balanceAfter = newBalance;

      await this.walletRepository.save(transaction);
      await this.dealerRepository.update(dealerId, { walletBalance: newBalance });
    }

    return {
      message: 'Dealer bonus transferred successfully',
      transaction,
    };
  }

  async getTransferPoints() {
    const transfers = await this.walletRepository.find({
      where: { source: TransactionSource.TRANSFER },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    return {
      transfers,
      totalTransfers: transfers.length,
    };
  }

  async manualTransferPoints(
    body: { fromUser: string; toUser: string; points: number; reason?: string },
    adminId: string,
  ) {
    const { fromUser, toUser, points, reason } = body;

    // toUser can be a UUID or a name/phone — store as description reference
    const transaction = this.walletRepository.create({
      userId: adminId, // use adminId as the wallet owner for manual transfers
      userRole: UserRole.ELECTRICIAN,
      type: TransactionType.CREDIT,
      source: TransactionSource.TRANSFER,
      amount: points,
      balanceBefore: 0,
      balanceAfter: points,
      description: reason || `Manual transfer from ${fromUser} to ${toUser}`,
      referenceId: adminId,
      referenceType: 'manual_transfer',
    });

    await this.walletRepository.save(transaction);

    return {
      message: 'Points transferred successfully',
      fromUser,
      toUser,
      points,
      reason,
      transaction,
    };
  }
}