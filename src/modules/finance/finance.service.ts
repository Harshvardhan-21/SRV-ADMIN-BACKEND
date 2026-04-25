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
      select: ['id', 'name', 'phone', 'walletBalance', 'monthlyTarget', 'achievedTarget', 'electricianCount'],
    });

    const bonusData = dealers.map(dealer => ({
      ...dealer,
      bonusEligible: (dealer.achievedTarget || 0) >= (dealer.monthlyTarget || 0),
      bonusAmount: Math.max(0, (dealer.achievedTarget || 0) - (dealer.monthlyTarget || 0)) * 0.1,
      bonusStatus: 'pending',
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

    const dealer = await this.dealerRepository.findOne({ where: { id: dealerId } });
    if (!dealer) throw new Error('Dealer not found');

    const currentBalance = dealer.walletBalance || 0;
    const newBalance = currentBalance + amount;

    const transaction = this.walletRepository.create({
      userId: dealerId,
      userRole: UserRole.DEALER,
      type: TransactionType.CREDIT,
      source: TransactionSource.BONUS,
      amount,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      description: description || 'Dealer bonus transfer',
      referenceId: adminId,
      referenceType: 'admin_transfer',
    });

    await this.walletRepository.save(transaction);
    await this.dealerRepository.update(dealerId, { walletBalance: newBalance });

    return {
      message: 'Dealer bonus transferred successfully',
      transaction,
    };
  }

  async getTransferPoints() {
    const transfers = await this.walletRepository.find({
      where: { source: TransactionSource.TRANSFER },
      order: { createdAt: 'DESC' },
      take: 200,
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

    const transaction = this.walletRepository.create({
      userId: adminId,
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

  async reverseTransfer(id: string, adminId: string) {
    const transfer = await this.walletRepository.findOne({ where: { id } });
    if (!transfer) throw new Error('Transfer not found');

    // Create a reversal transaction
    const reversal = this.walletRepository.create({
      userId: adminId,
      userRole: UserRole.ELECTRICIAN,
      type: TransactionType.DEBIT,
      source: TransactionSource.TRANSFER,
      amount: transfer.amount,
      balanceBefore: transfer.balanceAfter,
      balanceAfter: transfer.balanceBefore,
      description: `Reversal of: ${transfer.description}`,
      referenceId: id,
      referenceType: 'transfer_reversal',
    });

    await this.walletRepository.save(reversal);

    // Mark original as reversed
    await this.walletRepository.update(id, {
      description: `[REVERSED] ${transfer.description}`,
      referenceType: 'reversed_transfer',
    });

    return { message: 'Transfer reversed successfully', reversal };
  }

  async deleteTransfer(id: string) {
    const transfer = await this.walletRepository.findOne({ where: { id } });
    if (!transfer) throw new Error('Transfer not found');
    await this.walletRepository.delete(id);
    return { message: 'Transfer deleted successfully' };
  }

  async markDealerBonusPaid(dealerId: string, adminId: string) {
    const dealer = await this.dealerRepository.findOne({ where: { id: dealerId } });
    if (!dealer) throw new Error('Dealer not found');

    const bonusAmount = Math.max(0, (dealer.achievedTarget || 0) - (dealer.monthlyTarget || 0)) * 0.1;

    if (bonusAmount > 0) {
      const transaction = this.walletRepository.create({
        userId: dealerId,
        userRole: UserRole.DEALER,
        type: TransactionType.CREDIT,
        source: TransactionSource.BONUS,
        amount: bonusAmount,
        balanceBefore: dealer.walletBalance || 0,
        balanceAfter: (dealer.walletBalance || 0) + bonusAmount,
        description: `Monthly bonus payment`,
        referenceId: adminId,
        referenceType: 'bonus_payment',
      });
      await this.walletRepository.save(transaction);
      await this.dealerRepository.update(dealerId, {
        walletBalance: (dealer.walletBalance || 0) + bonusAmount,
      });
    }

    return { message: 'Dealer bonus marked as paid', dealerId, bonusAmount };
  }

  async bulkMarkDealerBonusPaid(dealerIds: string[], adminId: string) {
    const results = await Promise.allSettled(
      dealerIds.map(id => this.markDealerBonusPaid(id, adminId))
    );
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    return { message: `${succeeded}/${dealerIds.length} bonuses marked as paid`, succeeded };
  }
}
