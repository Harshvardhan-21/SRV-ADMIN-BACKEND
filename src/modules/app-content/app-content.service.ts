import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RewardScheme } from '../../database/entities/reward-scheme.entity';
import { Festival } from '../../database/entities/festival.entity';

@Injectable()
export class AppContentService {
  constructor(
    @InjectRepository(RewardScheme)
    private readonly rewardSchemeRepository: Repository<RewardScheme>,
    @InjectRepository(Festival)
    private readonly festivalRepository: Repository<Festival>,
  ) {}

  async rewardSchemes(role?: string, active?: string) {
    const qb = this.rewardSchemeRepository.createQueryBuilder('rewardScheme');

    if (role) {
      qb.andWhere(
        '(rewardScheme.targetRole IS NULL OR UPPER(rewardScheme.targetRole) = :role)',
        { role: role.toUpperCase() },
      );
    }

    if (active !== undefined) {
      qb.andWhere('rewardScheme.active = :active', {
        active: active === 'true',
      });
    }

    return qb
      .orderBy('rewardScheme.sortOrder', 'ASC')
      .addOrderBy('rewardScheme.pointsCost', 'ASC')
      .getMany();
  }

  async createRewardScheme(body: any) {
    if (!body?.name || !body?.category) {
      throw new BadRequestException('Reward scheme name and category are required');
    }

    const rewardScheme = this.rewardSchemeRepository.create({
      name: String(body.name).trim(),
      description: String(body.description ?? '').trim(),
      pointsCost: Number(body.pointsCost ?? body.points ?? 0),
      category: String(body.category).trim(),
      storeCategory: body.storeCategory ? String(body.storeCategory).trim() : null,
      imageUrl: body.imageUrl ? String(body.imageUrl).trim() : null,
      mrp: body.mrp !== undefined && body.mrp !== '' ? Number(body.mrp) : null,
      active: body.active !== undefined ? Boolean(body.active) : true,
      targetRole: body.targetRole ? String(body.targetRole).toUpperCase() : null,
      sortOrder: Number(body.sortOrder ?? 0),
      legacyCategoryId: body.legacyCategoryId ? String(body.legacyCategoryId) : null,
    });

    return this.rewardSchemeRepository.save(rewardScheme);
  }

  async updateRewardScheme(id: string, body: any) {
    const rewardScheme = await this.rewardSchemeRepository.findOne({ where: { id } });
    if (!rewardScheme) {
      throw new NotFoundException('Reward scheme not found');
    }

    await this.rewardSchemeRepository.update(id, {
      name: body?.name ?? rewardScheme.name,
      description: body?.description ?? rewardScheme.description,
      pointsCost:
        body?.pointsCost !== undefined || body?.points !== undefined
          ? Number(body.pointsCost ?? body.points ?? 0)
          : rewardScheme.pointsCost,
      category: body?.category ?? rewardScheme.category,
      storeCategory:
        body?.storeCategory !== undefined ? body.storeCategory || null : rewardScheme.storeCategory,
      imageUrl: body?.imageUrl !== undefined ? body.imageUrl || null : rewardScheme.imageUrl,
      mrp:
        body?.mrp !== undefined
          ? body.mrp === '' || body.mrp === null
            ? null
            : Number(body.mrp)
          : rewardScheme.mrp,
      active: body?.active !== undefined ? Boolean(body.active) : rewardScheme.active,
      targetRole:
        body?.targetRole !== undefined
          ? body.targetRole
            ? String(body.targetRole).toUpperCase()
            : null
          : rewardScheme.targetRole,
      sortOrder: body?.sortOrder !== undefined ? Number(body.sortOrder) : rewardScheme.sortOrder,
      legacyCategoryId:
        body?.legacyCategoryId !== undefined
          ? body.legacyCategoryId || null
          : rewardScheme.legacyCategoryId,
    });

    return this.rewardSchemeRepository.findOne({ where: { id } });
  }

  async deleteRewardScheme(id: string) {
    const rewardScheme = await this.rewardSchemeRepository.findOne({ where: { id } });
    if (!rewardScheme) {
      throw new NotFoundException('Reward scheme not found');
    }
    await this.rewardSchemeRepository.remove(rewardScheme);
    return { message: 'Reward scheme deleted successfully' };
  }

  async festivals() {
    return this.festivalRepository.find({
      order: { startDate: 'ASC', createdAt: 'DESC' },
    });
  }

  async createFestival(body: any) {
    if (!body?.name || !body?.slug || !body?.greeting || !body?.startDate || !body?.endDate) {
      throw new BadRequestException(
        'Festival name, slug, greeting, start date, and end date are required',
      );
    }

    const festival = this.festivalRepository.create({
      name: String(body.name).trim(),
      slug: String(body.slug).trim(),
      greeting: String(body.greeting).trim(),
      subGreeting: body.subGreeting ? String(body.subGreeting).trim() : null,
      emoji: body.emoji ? String(body.emoji) : '🎉',
      bannerEmojis: body.bannerEmojis ? String(body.bannerEmojis) : '🎉✨🎊',
      particleEmojis: body.particleEmojis ? String(body.particleEmojis) : '✨⭐🌟',
      primaryColor: body.primaryColor || '#DE3B30',
      secondaryColor: body.secondaryColor || '#F59E0B',
      accentColor: body.accentColor || '#FFFFFF',
      bgColor: body.bgColor || '#FFF8E7',
      cardColor: body.cardColor || '#FFFBF0',
      textColor: body.textColor || '#1C0A00',
      startDate: body.startDate,
      endDate: body.endDate,
      active: body.active !== undefined ? Boolean(body.active) : true,
    });

    return this.festivalRepository.save(festival);
  }

  async updateFestival(id: string, body: any) {
    const festival = await this.festivalRepository.findOne({ where: { id } });
    if (!festival) {
      throw new NotFoundException('Festival not found');
    }

    await this.festivalRepository.update(id, {
      name: body?.name ?? festival.name,
      slug: body?.slug ?? festival.slug,
      greeting: body?.greeting ?? festival.greeting,
      subGreeting:
        body?.subGreeting !== undefined ? body.subGreeting || null : festival.subGreeting,
      emoji: body?.emoji ?? festival.emoji,
      bannerEmojis: body?.bannerEmojis ?? festival.bannerEmojis,
      particleEmojis: body?.particleEmojis ?? festival.particleEmojis,
      primaryColor: body?.primaryColor ?? festival.primaryColor,
      secondaryColor: body?.secondaryColor ?? festival.secondaryColor,
      accentColor: body?.accentColor ?? festival.accentColor,
      bgColor: body?.bgColor ?? festival.bgColor,
      cardColor: body?.cardColor ?? festival.cardColor,
      textColor: body?.textColor ?? festival.textColor,
      startDate: body?.startDate ?? festival.startDate,
      endDate: body?.endDate ?? festival.endDate,
      active: body?.active !== undefined ? Boolean(body.active) : festival.active,
    });

    return this.festivalRepository.findOne({ where: { id } });
  }

  async deleteFestival(id: string) {
    const festival = await this.festivalRepository.findOne({ where: { id } });
    if (!festival) {
      throw new NotFoundException('Festival not found');
    }
    await this.festivalRepository.remove(festival);
    return { message: 'Festival deleted successfully' };
  }
}
