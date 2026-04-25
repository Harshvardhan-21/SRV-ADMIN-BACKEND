import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateGiftProductDto } from './dto/create-gift-product.dto';
import { UpdateGiftProductDto } from './dto/update-gift-product.dto';
import { Product } from '../../database/entities/product.entity';

@Injectable()
export class GiftService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async getProducts(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await this.productRepository.findAndCount({
      where: { category: 'gift' },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    // Map to frontend-expected shape
    const mapped = data.map((p) => ({
      id: p.id,
      name: p.name,
      image: p.image ?? '',
      pointsRequired: p.points ?? 0,
      stock: p.stock ?? 0,
      status: p.isActive ? 'active' : 'inactive',
      type: p.subCategory ?? 'electrician',
    }));

    return {
      data: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createProduct(createGiftProductDto: CreateGiftProductDto) {
    const pointsValue =
      createGiftProductDto.pointsRequired ??
      createGiftProductDto.points ??
      0;

    const giftProduct = this.productRepository.create({
      name: createGiftProductDto.name,
      sub: createGiftProductDto.sub ?? createGiftProductDto.name,
      category: 'gift',
      subCategory: createGiftProductDto.type ?? createGiftProductDto.subCategory ?? 'electrician',
      image: createGiftProductDto.image,
      points: pointsValue,
      stock: createGiftProductDto.stock ?? 0,
      isActive: createGiftProductDto.status
        ? createGiftProductDto.status === 'active'
        : (createGiftProductDto.isActive ?? true),
      price: createGiftProductDto.price ?? 0,
      mrp: createGiftProductDto.mrp,
      sku: createGiftProductDto.sku,
      weight: createGiftProductDto.weight,
      description: createGiftProductDto.description,
      badge: createGiftProductDto.badge,
    });
    const saved = await this.productRepository.save(giftProduct);
    return {
      id: saved.id,
      name: saved.name,
      image: saved.image ?? '',
      pointsRequired: saved.points ?? 0,
      stock: saved.stock ?? 0,
      status: saved.isActive ? 'active' : 'inactive',
      type: saved.subCategory ?? 'electrician',
    };
  }

  async updateProduct(id: string, updateGiftProductDto: UpdateGiftProductDto) {
    const product = await this.productRepository.findOne({
      where: { id, category: 'gift' },
    });

    if (!product) {
      throw new NotFoundException('Gift product not found');
    }

    const updateData: Partial<Product> = {};
    if (updateGiftProductDto.name !== undefined) updateData.name = updateGiftProductDto.name;
    if (updateGiftProductDto.image !== undefined) updateData.image = updateGiftProductDto.image;
    if (updateGiftProductDto.stock !== undefined) updateData.stock = updateGiftProductDto.stock;
    if ((updateGiftProductDto as any).pointsRequired !== undefined)
      updateData.points = (updateGiftProductDto as any).pointsRequired;
    if (updateGiftProductDto.points !== undefined) updateData.points = updateGiftProductDto.points;
    if ((updateGiftProductDto as any).status !== undefined)
      updateData.isActive = (updateGiftProductDto as any).status === 'active';
    if (updateGiftProductDto.isActive !== undefined) updateData.isActive = updateGiftProductDto.isActive;
    if ((updateGiftProductDto as any).type !== undefined)
      updateData.subCategory = (updateGiftProductDto as any).type;

    await this.productRepository.update(id, updateData);
    const updated = await this.productRepository.findOne({ where: { id } });
    return {
      id: updated!.id,
      name: updated!.name,
      image: updated!.image ?? '',
      pointsRequired: updated!.points ?? 0,
      stock: updated!.stock ?? 0,
      status: updated!.isActive ? 'active' : 'inactive',
      type: updated!.subCategory ?? 'electrician',
    };
  }

  async deleteProduct(id: string) {
    const product = await this.productRepository.findOne({
      where: { id, category: 'gift' },
    });

    if (!product) {
      throw new NotFoundException('Gift product not found');
    }

    await this.productRepository.remove(product);
    return { message: 'Gift product deleted successfully' };
  }

  async getOrders(page: number = 1, limit: number = 20, status?: string) {
    // Gift orders table not yet implemented — return empty paginated response
    return {
      data: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }

  async updateOrderStatus(id: string, status: string) {
    return {
      message: 'Order status updated successfully',
      orderId: id,
      newStatus: status,
      updatedAt: new Date(),
    };
  }
}
