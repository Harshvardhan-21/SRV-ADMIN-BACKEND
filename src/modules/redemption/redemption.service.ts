import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Redemption } from '../../database/entities/redemption.entity';
import { RedemptionStatus, UserRole } from '../../common/enums';

@Injectable()
export class RedemptionService {
  constructor(
    @InjectRepository(Redemption)
    private redemptionRepository: Repository<Redemption>,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 20,
    status?: RedemptionStatus,
    role?: UserRole,
    userId?: string,
  ) {
    const skip = (page - 1) * limit;
    const queryBuilder = this.redemptionRepository.createQueryBuilder('redemption');

    if (status) {
      queryBuilder.andWhere('redemption.status = :status', { status });
    }

    if (role) {
      queryBuilder.andWhere('redemption.role = :role', { role });
    }

    if (userId) {
      queryBuilder.andWhere('redemption.userId = :userId', { userId });
    }

    queryBuilder
      .orderBy('redemption.requestedAt', 'DESC')
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

  async findOne(id: string) {
    const redemption = await this.redemptionRepository.findOne({
      where: { id },
    });

    if (!redemption) {
      throw new NotFoundException('Redemption not found');
    }

    return redemption;
  }

  async approve(id: string, adminId: string) {
    const redemption = await this.findOne(id);

    if (redemption.status !== RedemptionStatus.PENDING) {
      throw new BadRequestException('Only pending redemptions can be approved');
    }

    await this.redemptionRepository.update(id, {
      status: RedemptionStatus.APPROVED,
      processedBy: adminId,
      processedAt: new Date(),
    });

    return this.findOne(id);
  }

  async reject(id: string, rejectionReason: string, adminId: string) {
    const redemption = await this.findOne(id);

    if (redemption.status !== RedemptionStatus.PENDING) {
      throw new BadRequestException('Only pending redemptions can be rejected');
    }

    const reason = rejectionReason?.trim() || 'Rejected by admin';

    await this.redemptionRepository.update(id, {
      status: RedemptionStatus.REJECTED,
      rejectionReason: reason,
      processedBy: adminId,
      processedAt: new Date(),
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    const redemption = await this.findOne(id);
    await this.redemptionRepository.remove(redemption);
    return { message: 'Redemption deleted successfully' };
  }
}