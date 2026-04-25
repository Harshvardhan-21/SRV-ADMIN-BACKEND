import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { Banner } from '../../database/entities/banner.entity';

@Injectable()
export class BannerService {
  constructor(
    @InjectRepository(Banner)
    private bannerRepository: Repository<Banner>,
  ) {}

  async create(createBannerDto: CreateBannerDto) {
    const banner = this.bannerRepository.create(createBannerDto);
    return this.bannerRepository.save(banner);
  }

  async findAll() {
    return this.bannerRepository.find({
      order: { order: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const banner = await this.bannerRepository.findOne({
      where: { id },
    });

    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    return banner;
  }

  async update(id: string, updateBannerDto: UpdateBannerDto) {
    await this.bannerRepository.update(id, updateBannerDto);
    return this.findOne(id);
  }

  async reorder(bannerOrders: { id: string; order: number }[]) {
    for (const { id, order } of bannerOrders) {
      await this.bannerRepository.update(id, { order });
    }
    return { message: 'Banners reordered successfully' };
  }

  async remove(id: string) {
    const banner = await this.findOne(id);
    await this.bannerRepository.remove(banner);
    return { message: 'Banner deleted successfully' };
  }
}