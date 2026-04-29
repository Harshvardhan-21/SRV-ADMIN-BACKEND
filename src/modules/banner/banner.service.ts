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

  // Normalize targetRole: accept string or array, always store as array
  // 'all' or empty means show to everyone (null in DB)
  private normalizeTargetRole(targetRole?: string[] | string | null): string[] | null {
    if (!targetRole) return null;
    if (Array.isArray(targetRole)) {
      const filtered = targetRole.filter((r) => r && r !== 'all');
      return filtered.length > 0 ? filtered : null;
    }
    if (targetRole === 'all' || targetRole === '') return null;
    return [targetRole];
  }

  async create(createBannerDto: CreateBannerDto) {
    const data = {
      ...createBannerDto,
      targetRole: this.normalizeTargetRole(createBannerDto.targetRole as any),
      // Sync isActive with status field
      isActive: createBannerDto.status !== 'inactive',
    };
    const banner = this.bannerRepository.create(data);
    return this.bannerRepository.save(banner);
  }

  async findAll() {
    return this.bannerRepository.find({
      order: { order: 'ASC', createdAt: 'DESC' },
    });
  }

  async syncIsActiveWithStatus() {
    // Fix existing banners: sync isActive with status
    await this.bannerRepository
      .createQueryBuilder()
      .update()
      .set({ isActive: true })
      .where("status = 'active' OR status IS NULL")
      .execute();

    await this.bannerRepository
      .createQueryBuilder()
      .update()
      .set({ isActive: false })
      .where("status = 'inactive'")
      .execute();

    return { message: 'Banner isActive fields synced with status', updated: true };
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
    const data: any = { ...updateBannerDto };
    if ('targetRole' in updateBannerDto) {
      data.targetRole = this.normalizeTargetRole(updateBannerDto.targetRole as any);
    }
    // Sync isActive with status field
    if ('status' in updateBannerDto) {
      data.isActive = updateBannerDto.status !== 'inactive';
    }
    await this.bannerRepository.update(id, data);
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
