import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { PointsConfigDto } from './dto/points-config.dto';
import { Settings } from '../../database/entities/settings.entity';
import { PointsConfig } from '../../database/entities/points-config.entity';
import { Product } from '../../database/entities/product.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Settings)
    private settingsRepository: Repository<Settings>,
    @InjectRepository(PointsConfig)
    private pointsConfigRepository: Repository<PointsConfig>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async findAll() {
    return this.settingsRepository.find({
      order: { key: 'ASC' },
    });
  }

  async findOne(key: string) {
    const setting = await this.settingsRepository.findOne({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException('Setting not found');
    }

    return setting;
  }

  async update(key: string, updateSettingDto: UpdateSettingDto, adminId: string) {
    const { value, description } = updateSettingDto;

    const existingSetting = await this.settingsRepository.findOne({
      where: { key },
    });

    if (existingSetting) {
      await this.settingsRepository.update(existingSetting.id, {
        value,
        description,
        updatedBy: adminId,
        updatedAt: new Date(),
      });
    } else {
      const newSetting = this.settingsRepository.create({
        id: randomUUID(),
        key,
        value,
        description,
        updatedBy: adminId,
        updatedAt: new Date(),
      });
      await this.settingsRepository.save(newSetting);
    }

    return this.findOne(key);
  }

  async configurePoints(pointsConfigDto: PointsConfigDto, adminId: string) {
    const { productId, basePoints, bonusPoints } = pointsConfigDto;

    // Verify product exists
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Update or create points config
    const existingConfig = await this.pointsConfigRepository.findOne({
      where: { productId },
    });

    if (existingConfig) {
      await this.pointsConfigRepository.update(existingConfig.id, {
        basePoints,
        bonusPoints,
      });
    } else {
      const newConfig = this.pointsConfigRepository.create({
        productId,
        productName: product.name,
        basePoints,
        bonusPoints,
      });
      await this.pointsConfigRepository.save(newConfig);
    }

    // Also update the product's points field
    await this.productRepository.update(productId, {
      points: basePoints + (bonusPoints || 0),
    });

    return {
      message: 'Points configuration updated successfully',
      productName: product.name,
      basePoints,
      bonusPoints,
      totalPoints: basePoints + (bonusPoints || 0),
    };
  }
}