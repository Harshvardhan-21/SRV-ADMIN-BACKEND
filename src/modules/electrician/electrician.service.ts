import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { CreateElectricianDto } from './dto/create-electrician.dto';
import { UpdateElectricianDto } from './dto/update-electrician.dto';
import { Electrician } from '../../database/entities/electrician.entity';
import { Scan } from '../../database/entities/scan.entity';
import { Wallet } from '../../database/entities/wallet.entity';
import { UserStatus, MemberTier } from '../../common/enums';

@Injectable()
export class ElectricianService {
  constructor(
    @InjectRepository(Electrician)
    private electricianRepository: Repository<Electrician>,
    @InjectRepository(Scan)
    private scanRepository: Repository<Scan>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
  ) {}

  async create(createElectricianDto: CreateElectricianDto) {
    const existingElectrician = await this.electricianRepository.findOne({
      where: [
        { phone: createElectricianDto.phone },
        { electricianCode: createElectricianDto.electricianCode },
      ],
    });

    if (existingElectrician) {
      throw new ConflictException('Electrician with this phone or code already exists');
    }

    // Sanitize UUID fields — empty string is not a valid UUID
    const data: any = { ...createElectricianDto };
    if (!data.dealerId || data.dealerId.trim() === '') {
      data.dealerId = null;
    }

    const electrician = this.electricianRepository.create(data);
    return this.electricianRepository.save(electrician);
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    search?: string,
    status?: UserStatus,
    tier?: MemberTier,
    state?: string,
  ) {
    const skip = (page - 1) * limit;
    const queryBuilder = this.electricianRepository
      .createQueryBuilder('electrician')
      .leftJoinAndSelect('electrician.dealer', 'dealer');

    if (search) {
      queryBuilder.andWhere(
        '(electrician.name ILIKE :search OR electrician.phone ILIKE :search OR electrician.city ILIKE :search OR electrician.electricianCode ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (status) {
      queryBuilder.andWhere('electrician.status = :status', { status });
    }

    if (tier) {
      queryBuilder.andWhere('electrician.tier = :tier', { tier });
    }

    if (state) {
      queryBuilder.andWhere('electrician.state = :state', { state });
    }

    queryBuilder
      .orderBy('electrician.joinedDate', 'DESC')
      .skip(skip)
      .take(limit);

    const [rawData, total] = await queryBuilder.getManyAndCount();

    // Attach dealerName from joined dealer relation
    const data = rawData.map(e => ({
      ...e,
      dealerName: (e as any).dealer?.name ?? null,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const electrician = await this.electricianRepository.findOne({
      where: { id },
      relations: ['dealer'],
    });

    if (!electrician) {
      throw new NotFoundException('Electrician not found');
    }

    return electrician;
  }

  async update(id: string, updateElectricianDto: UpdateElectricianDto) {
    const electrician = await this.findOne(id);

    if (updateElectricianDto.phone && updateElectricianDto.phone !== electrician.phone) {
      const existingElectrician = await this.electricianRepository.findOne({
        where: { phone: updateElectricianDto.phone },
      });

      if (existingElectrician) {
        throw new ConflictException('Electrician with this phone already exists');
      }
    }

    // Sanitize UUID fields
    const data: any = { ...updateElectricianDto };
    if (data.dealerId !== undefined && (!data.dealerId || data.dealerId.trim() === '')) {
      data.dealerId = null;
    }

    // Auto-recalculate tier when totalPoints is updated directly by admin
    if (data.totalPoints !== undefined) {
      const points = Number(data.totalPoints);
      if (!data.tier) {
        // Only auto-set tier if admin didn't explicitly set it
        data.tier = this.calculateTier(points);
      }
      // Keep walletBalance in sync with totalPoints if walletBalance not explicitly set
      if (data.walletBalance === undefined) {
        data.walletBalance = points;
      }
    }

    // If walletBalance is set but totalPoints is not, sync totalPoints too
    if (data.walletBalance !== undefined && data.totalPoints === undefined) {
      data.totalPoints = Number(data.walletBalance);
      if (!data.tier) {
        data.tier = this.calculateTier(data.totalPoints);
      }
    }

    await this.electricianRepository.update(id, data);
    return this.findOne(id);
  }

  private calculateTier(points: number): string {
    if (points >= 10000) return 'Diamond';
    if (points >= 5001) return 'Platinum';
    if (points >= 1001) return 'Gold';
    return 'Silver';
  }

  async updateStatus(id: string, status: UserStatus) {
    await this.electricianRepository.update(id, { status });
    return this.findOne(id);
  }

  async remove(id: string) {
    const electrician = await this.findOne(id);
    await this.electricianRepository.remove(electrician);
    return { message: 'Electrician deleted successfully' };
  }

  async getElectricianScans(id: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const [data, total] = await this.scanRepository.findAndCount({
      where: { userId: id },
      skip,
      take: limit,
      order: { scannedAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getElectricianWallet(id: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const [data, total] = await this.walletRepository.findAndCount({
      where: { userId: id },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}