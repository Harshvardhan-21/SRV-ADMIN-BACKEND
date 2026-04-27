import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenerateQrCodeDto } from './dto/generate-qr-code.dto';
import { QrCode } from '../../database/entities/qr-code.entity';
import { Product } from '../../database/entities/product.entity';

@Injectable()
export class QrCodeService {
  constructor(
    @InjectRepository(QrCode)
    private qrCodeRepository: Repository<QrCode>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async generate(generateQrCodeDto: GenerateQrCodeDto) {
    const { productId, quantity, batchId } = generateQrCodeDto;

    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (quantity <= 0 || quantity > 20000) {
      throw new BadRequestException('Quantity must be between 1 and 20000');
    }

    // Use SKU if available, else short product ID prefix
    const skuPrefix = product.sku
      ? product.sku.toUpperCase()
      : product.id.substring(0, 8).toUpperCase();
    const batchPrefix = batchId
      ? batchId.toUpperCase()
      : `B${Date.now().toString(36).toUpperCase()}`;

    // Build all QR code records — do NOT store base64 image in DB
    // The code string itself is what gets encoded into the QR image (generated on frontend)
    const qrEntities: Partial<QrCode>[] = [];
    for (let i = 0; i < quantity; i++) {
      const seq = String(i + 1).padStart(5, '0');
      const code = `${skuPrefix}-${batchPrefix}-${seq}`;
      qrEntities.push({
        code,
        productId,
        productName: product.name,
        batchId: batchPrefix,
        isScanned: false,
        isActive: true,
        // qrImageUrl intentionally left null — generated on frontend from `code`
      });
    }

    // Bulk insert in chunks of 500 for performance
    const CHUNK = 500;
    const savedCodes: QrCode[] = [];
    for (let i = 0; i < qrEntities.length; i += CHUNK) {
      const chunk = qrEntities.slice(i, i + CHUNK);
      const saved = await this.qrCodeRepository.save(chunk as QrCode[]);
      savedCodes.push(...saved);
    }

    return {
      message: `${quantity} QR codes generated successfully`,
      batchId: batchPrefix,
      productName: product.name,
      sku: product.sku,
      points: product.points,
      codes: savedCodes,
    };
  }

  async getStats() {
    const [total, active, used] = await Promise.all([
      this.qrCodeRepository.count(),
      this.qrCodeRepository.count({ where: { isScanned: false } }),
      this.qrCodeRepository.count({ where: { isScanned: true } }),
    ]);
    return { total, active, used };
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    productId?: string,
    isScanned?: boolean,
    search?: string,
    batchId?: string,
  ) {
    const skip = (page - 1) * limit;
    const queryBuilder = this.qrCodeRepository
      .createQueryBuilder('qrCode')
      .leftJoinAndSelect('qrCode.product', 'product');

    if (productId) {
      queryBuilder.andWhere('qrCode.productId = :productId', { productId });
    }

    if (isScanned !== undefined) {
      queryBuilder.andWhere('qrCode.isScanned = :isScanned', { isScanned });
    }

    if (search) {
      queryBuilder.andWhere(
        '(qrCode.code ILIKE :search OR qrCode.productName ILIKE :search OR qrCode.batchId ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (batchId) {
      queryBuilder.andWhere('qrCode.batchId = :batchId', { batchId });
    }

    queryBuilder
      .orderBy('qrCode.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    // Attach points from product relation — explicitly map to plain objects
    // to avoid TypeORM entity serialization issues with spread operator
    const enriched = data.map(qr => {
      const productPoints = qr.product?.points ?? 0;
      return {
        id: qr.id,
        code: qr.code,
        productId: qr.productId,
        productName: qr.productName,
        qrImageUrl: qr.qrImageUrl,
        isScanned: qr.isScanned,
        scanCount: qr.scanCount,
        lastScannedBy: qr.lastScannedBy,
        lastScannedAt: qr.lastScannedAt,
        batchId: qr.batchId,
        isActive: qr.isActive,
        createdAt: qr.createdAt,
        updatedAt: qr.updatedAt,
        points: productPoints,
        product: qr.product ? {
          id: qr.product.id,
          name: qr.product.name,
          points: qr.product.points,
          sku: qr.product.sku,
          isActive: qr.product.isActive,
        } : null,
      };
    });

    return {
      data: enriched,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const qrCode = await this.qrCodeRepository.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!qrCode) {
      throw new NotFoundException(`QR code with id "${id}" not found`);
    }

    return qrCode;
  }

  async remove(id: string) {
    // Try by UUID first, then by code string
    let qrCode = await this.qrCodeRepository.findOne({ where: { id } });
    if (!qrCode) {
      qrCode = await this.qrCodeRepository.findOne({ where: { code: id } });
    }
    if (!qrCode) {
      throw new NotFoundException(`QR code "${id}" not found`);
    }
    await this.qrCodeRepository.remove(qrCode);
    return { message: 'QR code deleted successfully' };
  }

  async removeAll(productId?: string) {
    if (productId) {
      const result = await this.qrCodeRepository.delete({ productId });
      return {
        message: `Deleted all QR codes for product ${productId}`,
        deleted: result.affected ?? 0,
      };
    }
    // Delete all — use truncate-style delete
    const count = await this.qrCodeRepository.count();
    await this.qrCodeRepository.clear();
    return { message: 'All QR codes deleted', deleted: count };
  }
}
