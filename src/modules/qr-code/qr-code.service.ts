import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenerateQrCodeDto } from './dto/generate-qr-code.dto';
import { QrCode } from '../../database/entities/qr-code.entity';
import { Product } from '../../database/entities/product.entity';
import * as QRCode from 'qrcode';

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

    if (quantity <= 0 || quantity > 1000) {
      throw new BadRequestException('Quantity must be between 1 and 1000');
    }

    const qrCodes = [];
    // Use SKU if available, else short product ID prefix
    const skuPrefix = product.sku
      ? product.sku.toUpperCase()
      : product.id.substring(0, 8).toUpperCase();
    const batchPrefix = batchId ? batchId.toUpperCase() : `B${Date.now().toString(36).toUpperCase()}`;

    for (let i = 0; i < quantity; i++) {
      const seq = String(i + 1).padStart(4, '0');
      const code = `${skuPrefix}-${batchPrefix}-${seq}`;

      try {
        const qrImageUrl = await QRCode.toDataURL(code);

        const qrCode = this.qrCodeRepository.create({
          code,
          productId,
          productName: product.name,
          qrImageUrl,
          batchId: batchPrefix,
        });

        qrCodes.push(qrCode);
      } catch (error) {
        throw new BadRequestException('Failed to generate QR code');
      }
    }

    const savedQrCodes = await this.qrCodeRepository.save(qrCodes);

    return {
      message: `${quantity} QR codes generated successfully`,
      batchId: batchPrefix,
      productName: product.name,
      sku: product.sku,
      points: product.points,
      codes: savedQrCodes,
    };
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    productId?: string,
    isScanned?: boolean,
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

    queryBuilder
      .orderBy('qrCode.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    // Attach points from product
    const enriched = data.map(qr => ({
      ...qr,
      points: (qr as any).product?.points ?? 0,
    }));

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
    });

    if (!qrCode) {
      throw new NotFoundException('QR code not found');
    }

    return qrCode;
  }

  async remove(id: string) {
    const qrCode = await this.findOne(id);
    await this.qrCodeRepository.remove(qrCode);
    return { message: 'QR code deleted successfully' };
  }
}