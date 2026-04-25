import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { Offer } from '../../database/entities/offer.entity';
import { OfferStatus } from '../../common/enums';

@Injectable()
export class OfferService {
  constructor(
    @InjectRepository(Offer)
    private offerRepository: Repository<Offer>,
  ) {}

  async create(createOfferDto: CreateOfferDto) {
    const offer = this.offerRepository.create(createOfferDto);
    return this.offerRepository.save(offer);
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    status?: OfferStatus,
    targetRole?: string,
  ) {
    const skip = (page - 1) * limit;
    const queryBuilder = this.offerRepository.createQueryBuilder('offer');

    if (status) {
      queryBuilder.andWhere('offer.status = :status', { status });
    }

    if (targetRole) {
      queryBuilder.andWhere('offer.targetRole = :targetRole', { targetRole });
    }

    queryBuilder
      .orderBy('offer.createdAt', 'DESC')
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
    const offer = await this.offerRepository.findOne({
      where: { id },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    return offer;
  }

  async update(id: string, updateOfferDto: UpdateOfferDto) {
    await this.offerRepository.update(id, updateOfferDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const offer = await this.findOne(id);
    await this.offerRepository.remove(offer);
    return { message: 'Offer deleted successfully' };
  }
}