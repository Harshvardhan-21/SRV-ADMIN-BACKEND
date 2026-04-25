import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDealerDto } from './dto/create-dealer.dto';
import { UpdateDealerDto } from './dto/update-dealer.dto';
import { Dealer } from '../../database/entities/dealer.entity';
import { Electrician } from '../../database/entities/electrician.entity';
import { Wallet } from '../../database/entities/wallet.entity';
import { UserStatus, MemberTier } from '../../common/enums';

@Injectable()
export class DealerService {
  constructor(
    @InjectRepository(Dealer)
    private dealerRepository: Repository<Dealer>,
    @InjectRepository(Electrician)
    private electricianRepository: Repository<Electrician>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
  ) {}

  async create(createDealerDto: CreateDealerDto) {
    const existingDealer = await this.dealerRepository.findOne({
      where: [
        { phone: createDealerDto.phone },
        { dealerCode: createDealerDto.dealerCode },
      ],
    });

    if (existingDealer) {
      throw new ConflictException('Dealer with this phone or code already exists');
    }

    const dealer = this.dealerRepository.create(createDealerDto);
    return this.dealerRepository.save(dealer);
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
    const queryBuilder = this.dealerRepository.createQueryBuilder('dealer');

    if (search) {
      queryBuilder.andWhere(
        '(dealer.name ILIKE :search OR dealer.phone ILIKE :search OR dealer.town ILIKE :search OR dealer.dealerCode ILIKE :search OR dealer.contactPerson ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (status) {
      queryBuilder.andWhere('dealer.status = :status', { status });
    }

    if (tier) {
      queryBuilder.andWhere('dealer.tier = :tier', { tier });
    }

    if (state) {
      queryBuilder.andWhere('dealer.state = :state', { state });
    }

    queryBuilder
      .orderBy('dealer.joinedDate', 'DESC')
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
    const dealer = await this.dealerRepository.findOne({
      where: { id },
      relations: ['electricians'],
    });

    if (!dealer) {
      throw new NotFoundException('Dealer not found');
    }

    return dealer;
  }

  async update(id: string, updateDealerDto: UpdateDealerDto) {
    const dealer = await this.findOne(id);

    if (updateDealerDto.phone && updateDealerDto.phone !== dealer.phone) {
      const existingDealer = await this.dealerRepository.findOne({
        where: { phone: updateDealerDto.phone },
      });

      if (existingDealer) {
        throw new ConflictException('Dealer with this phone already exists');
      }
    }

    await this.dealerRepository.update(id, updateDealerDto);
    return this.findOne(id);
  }

  async updateStatus(id: string, status: UserStatus) {
    await this.dealerRepository.update(id, { status });
    return this.findOne(id);
  }

  async remove(id: string) {
    const dealer = await this.findOne(id);
    await this.dealerRepository.remove(dealer);
    return { message: 'Dealer deleted successfully' };
  }

  async getDealerElectricians(id: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const [data, total] = await this.electricianRepository.findAndCount({
      where: { dealerId: id },
      skip,
      take: limit,
      order: { joinedDate: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDealerWallet(id: string, page: number = 1, limit: number = 20) {
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