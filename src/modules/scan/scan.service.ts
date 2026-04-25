import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Scan } from '../../database/entities/scan.entity';
import { UserRole } from '../../common/enums';

@Injectable()
export class ScanService {
  constructor(
    @InjectRepository(Scan)
    private scanRepository: Repository<Scan>,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 20,
    userId?: string,
    productId?: string,
    role?: UserRole,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const skip = (page - 1) * limit;
    const queryBuilder = this.scanRepository.createQueryBuilder('scan');

    if (userId) {
      queryBuilder.andWhere('scan.userId = :userId', { userId });
    }

    if (productId) {
      queryBuilder.andWhere('scan.productId = :productId', { productId });
    }

    if (role) {
      queryBuilder.andWhere('scan.role = :role', { role });
    }

    if (dateFrom && dateTo) {
      queryBuilder.andWhere('scan.scannedAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
      });
    }

    queryBuilder
      .orderBy('scan.scannedAt', 'DESC')
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
    const scan = await this.scanRepository.findOne({
      where: { id },
      relations: ['electrician', 'dealer', 'product'],
    });

    if (!scan) {
      throw new NotFoundException('Scan not found');
    }

    return scan;
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [totalScans, todayScans, yesterdayScans, weekScans] = await Promise.all([
      this.scanRepository.count(),
      this.scanRepository.count({
        where: { scannedAt: Between(today, new Date()) },
      }),
      this.scanRepository.count({
        where: { scannedAt: Between(yesterday, today) },
      }),
      this.scanRepository.count({
        where: { scannedAt: Between(weekAgo, new Date()) },
      }),
    ]);

    const electricianScans = await this.scanRepository.count({
      where: { role: UserRole.ELECTRICIAN },
    });

    const dealerScans = await this.scanRepository.count({
      where: { role: UserRole.DEALER },
    });

    return {
      totalScans,
      todayScans,
      yesterdayScans,
      weekScans,
      electricianScans,
      dealerScans,
      growthRate: yesterdayScans > 0 ? ((todayScans - yesterdayScans) / yesterdayScans) * 100 : 0,
    };
  }
}