import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../database/entities/product.entity';
import { Banner } from '../../database/entities/banner.entity';
import { Notification } from '../../database/entities/notification.entity';
import { Offer } from '../../database/entities/offer.entity';
import { Testimonial } from '../../database/entities/testimonial.entity';
import { QrCode } from '../../database/entities/qr-code.entity';
import { Scan } from '../../database/entities/scan.entity';
import { Wallet } from '../../database/entities/wallet.entity';
import { Electrician } from '../../database/entities/electrician.entity';
import { Dealer } from '../../database/entities/dealer.entity';
import { Redemption } from '../../database/entities/redemption.entity';
import { Settings } from '../../database/entities/settings.entity';
import { UserRole, ScanMode } from '../../common/enums';
import { TierService } from '../../common/services/tier.service';

@Injectable()
export class MobileService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Banner)
    private bannerRepository: Repository<Banner>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(Offer)
    private offerRepository: Repository<Offer>,
    @InjectRepository(Testimonial)
    private testimonialRepository: Repository<Testimonial>,
    @InjectRepository(QrCode)
    private qrCodeRepository: Repository<QrCode>,
    @InjectRepository(Scan)
    private scanRepository: Repository<Scan>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Electrician)
    private electricianRepository: Repository<Electrician>,
    @InjectRepository(Dealer)
    private dealerRepository: Repository<Dealer>,
    @InjectRepository(Redemption)
    private redemptionRepository: Repository<Redemption>,
    @InjectRepository(Settings)
    private settingsRepository: Repository<Settings>,
    private readonly tierService: TierService,
  ) {}

  async getProducts(category?: string) {
    const qb = this.productRepository
      .createQueryBuilder('product')
      .where('product.isActive = :isActive', { isActive: true });

    if (category) {
      qb.andWhere('product.category = :category', { category });
    }

    qb.orderBy('product.createdAt', 'DESC');
    const products = await qb.getMany();
    return { data: products };
  }

  async getBanners(role?: string) {
    const where: any = { isActive: true };
    const banners = await this.bannerRepository.find({
      where,
      order: { displayOrder: 'ASC', order: 'ASC' },
    });
    return { data: banners };
  }

  async getNotifications(userId?: string, role?: string) {
    const qb = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.status = :status', { status: 'sent' });

    // Just return all sent notifications, no role filter
    qb.orderBy('notification.sentAt', 'DESC').take(50);
    const notifications = await qb.getMany();
    return { data: notifications };
  }

  async deleteNotification(id: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationRepository.remove(notification);
    return { message: 'Notification deleted successfully' };
  }

  async getMaintenanceMode() {
    const setting = await this.settingsRepository.findOne({
      where: { key: 'maintenanceMode' },
    });

    return {
      maintenanceMode: setting?.value === 'true',
      message: setting?.value === 'true' ? 'App is under maintenance' : 'All systems operational',
    };
  }

  async getOffers(role?: string) {
    const today = new Date();
    const qb = this.offerRepository
      .createQueryBuilder('offer')
      .where('offer.status = :status', { status: 'active' })
      .andWhere('offer.validFrom <= :today', { today })
      .andWhere('offer.validTo >= :today', { today });

    if (role) {
      qb.andWhere('(offer.targetRole IS NULL OR offer.targetRole = :role)', { role });
    }

    qb.orderBy('offer.createdAt', 'DESC');
    const offers = await qb.getMany();
    return { data: offers };
  }

  async getTestimonials() {
    const testimonials = await this.testimonialRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC' },
    });
    return { data: testimonials };
  }

  async getDealerByPhone(phone: string) {
    if (!phone) throw new BadRequestException('Phone number is required');
    const dealer = await this.dealerRepository.findOne({ where: { phone } });
    if (!dealer) throw new NotFoundException('Dealer not found');
    return {
      id: dealer.id,
      name: dealer.name,
      phone: dealer.phone,
      dealerCode: dealer.dealerCode,
      town: dealer.town,
      district: dealer.district,
      state: dealer.state,
    };
  }

  async submitScan(userId: string, role: string, qrCode: string, mode: 'single' | 'multi') {
    // Find QR code in database
    const qr = await this.qrCodeRepository.findOne({
      where: { code: qrCode, isActive: true },
      relations: ['product'],
    });

    if (!qr) {
      throw new NotFoundException('QR code not found or invalid');
    }

    if (!qr.product || !qr.product.isActive) {
      throw new BadRequestException('Product is not active');
    }

    // Check if already scanned by this user
    const existingScan = await this.scanRepository.findOne({
      where: { userId, qrCodeId: qr.id },
    });

    if (existingScan) {
      throw new ConflictException('This QR code has already been scanned by you');
    }

    const points = qr.product.points;
    const userRole = role === 'electrician' ? UserRole.ELECTRICIAN : UserRole.DEALER;

    // Get user info
    let user: any;
    let userName: string;
    if (role === 'electrician') {
      user = await this.electricianRepository.findOne({ where: { id: userId } });
      userName = user?.name ?? 'Unknown';
    } else {
      user = await this.dealerRepository.findOne({ where: { id: userId } });
      userName = user?.name ?? 'Unknown';
    }

    // Save scan record
    const scan = this.scanRepository.create({
      userId,
      userName,
      role: userRole,
      productId: qr.product.id,
      productName: qr.product.name,
      points,
      mode: mode === 'multi' ? ScanMode.MULTI : ScanMode.SINGLE,
      qrCodeId: qr.id,
    });
    await this.scanRepository.save(scan);

    // Update QR code scan status
    await this.qrCodeRepository.update(qr.id, {
      isScanned: true,
      scanCount: (qr.scanCount ?? 0) + 1,
      lastScannedBy: userId,
      lastScannedAt: new Date(),
    });

    // Update product scan count
    await this.productRepository.update(qr.product.id, {
      totalScanned: (qr.product.totalScanned ?? 0) + 1,
    });

    // Update user points and wallet
    if (role === 'electrician' && user) {
      const newPoints = (user.totalPoints ?? 0) + points;
      const newScans = (user.totalScans ?? 0) + 1;
      const newWallet = (user.walletBalance ?? 0) + points;
      const newTier = this.tierService.calculateElectricianTier(newPoints);

      await this.electricianRepository.update(userId, {
        totalPoints: newPoints,
        totalScans: newScans,
        walletBalance: newWallet,
        tier: newTier as any,
        lastActivityAt: new Date(),
      });

      // Save wallet transaction
      const walletTx = this.walletRepository.create({
        userId,
        userRole: UserRole.ELECTRICIAN,
        type: 'credit' as any,
        source: 'scan' as any,
        amount: points,
        balanceBefore: user.walletBalance ?? 0,
        balanceAfter: newWallet,
        description: `Scan: ${qr.product.name}`,
        referenceId: scan.id,
        referenceType: 'scan',
      });
      await this.walletRepository.save(walletTx);
    }

    return {
      success: true,
      scan: {
        id: scan.id,
        productName: qr.product.name,
        points,
        mode,
        scannedAt: scan.scannedAt,
      },
      pointsEarned: points,
    };
  }

  async getWallet(userId: string, role: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    let user: any;
    if (role === 'electrician') {
      user = await this.electricianRepository.findOne({ where: { id: userId } });
    } else {
      user = await this.dealerRepository.findOne({ where: { id: userId } });
    }

    const [transactions, total] = await this.walletRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      balance: user?.walletBalance ?? 0,
      totalPoints: role === 'electrician' ? (user?.totalPoints ?? 0) : 0,
      totalScans: role === 'electrician' ? (user?.totalScans ?? 0) : 0,
      transactions: {
        data: transactions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getScanHistory(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [scans, total] = await this.scanRepository.findAndCount({
      where: { userId },
      order: { scannedAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: scans,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDealerElectricians(dealerId: string, page: number = 1, limit: number = 50, search?: string) {
    const skip = (page - 1) * limit;
    const qb = this.electricianRepository
      .createQueryBuilder('electrician')
      .where('electrician.dealerId = :dealerId', { dealerId });

    if (search) {
      qb.andWhere(
        '(electrician.name ILIKE :search OR electrician.phone ILIKE :search OR electrician.city ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    qb.orderBy('electrician.joinedDate', 'DESC').skip(skip).take(limit);
    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async addElectrician(dealerId: string, body: any) {
    const dealer = await this.dealerRepository.findOne({ where: { id: dealerId } });
    if (!dealer) throw new NotFoundException('Dealer not found');

    // Check if electrician already exists
    const existing = await this.electricianRepository.findOne({
      where: { phone: body.phone },
    });

    if (existing) {
      // If already linked to this dealer, return as-is
      if (existing.dealerId === dealerId) {
        return { message: 'Electrician already in your network', electrician: existing };
      }
      // Link to this dealer
      const oldDealerId = existing.dealerId;
      await this.electricianRepository.update(existing.id, { dealerId });
      // Sync both old and new dealer tiers
      if (oldDealerId) await this.tierService.syncDealerTier(oldDealerId);
      await this.tierService.syncDealerTier(dealerId);
      return { message: 'Electrician linked to your network', electrician: existing };
    }

    // Create new electrician
    const code = `${dealer.state?.substring(0, 2).toUpperCase() ?? 'XX'}${Date.now().toString().slice(-6)}`;
    const electrician = this.electricianRepository.create({
      name: body.name,
      phone: body.phone,
      electricianCode: code,
      city: body.city ?? dealer.town,
      state: body.state ?? dealer.state,
      district: body.district ?? dealer.district,
      dealerId,
      status: 'active' as any,
    });

    const saved = await this.electricianRepository.save(electrician);
    // Sync dealer tier after adding electrician
    await this.tierService.syncDealerTier(dealerId);

    return { message: 'Electrician added successfully', electrician: saved };
  }

  async getRedemptionHistory(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.redemptionRepository.findAndCount({
      where: { userId },
      order: { requestedAt: 'DESC' },
      skip,
      take: limit,
    });
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAppSettings() {
    const rows = await this.settingsRepository.find({ order: { key: 'ASC' } });
    const map: Record<string, string> = {};
    rows.forEach(r => { map[r.key] = r.value; });
    return {
      maintenanceMode: map['maintenanceMode'] === 'true',
      maintenanceMessage: map['maintenanceMessage'] ?? 'App is under maintenance. Please try again later.',
      supportPhone: map['supportPhone'] ?? '+91 88376 84004',
      supportEmail: map['supportEmail'] ?? 'support@srvelectricals.com',
      whatsappNumber: map['whatsappNumber'] ?? '918837684004',
      appVersion: map['appVersion'] ?? '1.0.0',
      minAppVersion: map['minAppVersion'] ?? '1.0.0',
      forceUpdate: map['forceUpdate'] === 'true',
      scanEnabled: map['scanEnabled'] !== 'false',
      giftsEnabled: map['giftsEnabled'] !== 'false',
      referralEnabled: map['referralEnabled'] !== 'false',
    };
  }
}
