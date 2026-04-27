import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../database/entities/product.entity';
import { ProductCategory } from '../../database/entities/product-category.entity';
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
import { Festival } from '../../database/entities/festival.entity';
import { SupportTicket } from '../../database/entities/support-ticket.entity';
import { AppRating } from '../../database/entities/app-rating.entity';
import { RewardScheme } from '../../database/entities/reward-scheme.entity';
import { UserRole, ScanMode } from '../../common/enums';

@Injectable()
export class MobileService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductCategory)
    private productCategoryRepository: Repository<ProductCategory>,
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
    @InjectRepository(Festival)
    private festivalRepository: Repository<Festival>,
    @InjectRepository(SupportTicket)
    private supportTicketRepository: Repository<SupportTicket>,
    @InjectRepository(AppRating)
    private appRatingRepository: Repository<AppRating>,
    @InjectRepository(RewardScheme)
    private rewardSchemeRepository: Repository<RewardScheme>,
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

  async getProductCategories() {
    // Get distinct categories from products table
    const products = await this.productRepository
      .createQueryBuilder('product')
      .select('product.category', 'category')
      .addSelect('COUNT(product.id)', 'count')
      .where('product.isActive = :isActive', { isActive: true })
      .groupBy('product.category')
      .getRawMany();

    // Also get from product_categories table if it has entries
    const dbCategories = await this.productCategoryRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });

    if (dbCategories.length > 0) {
      const data = dbCategories.map((cat) => {
        const productCount = products.find((p) => p.category === cat.label.toLowerCase().replace(/\s+/g, ''))?.count ?? 0;
        return {
          id: cat.id,
          categoryId: cat.label.toLowerCase().replace(/\s+/g, ''),
          label: cat.label,
          glyph: cat.glyph,
          imageUrl: cat.imageUrl,
          productCount: parseInt(productCount, 10),
        };
      });
      return { data };
    }

    // Fallback: derive categories from products
    const data = products.map((p) => ({
      id: p.category,
      categoryId: p.category,
      label: p.category.charAt(0).toUpperCase() + p.category.slice(1),
      productCount: parseInt(p.count, 10),
    }));
    return { data };
  }

  async getBanners(role?: string) {
    const qb = this.bannerRepository
      .createQueryBuilder('banner')
      .where('banner.isActive = :isActive', { isActive: true })
      .andWhere("(banner.status IS NULL OR banner.status <> 'inactive')");

    if (role) {
      qb.andWhere(
        '(banner.targetRole IS NULL OR banner.targetRole = \'\' OR banner.targetRole ILIKE :role)',
        { role: `%${role}%` },
      );
    }

    qb.orderBy('banner.displayOrder', 'ASC').addOrderBy('banner.order', 'ASC');
    const banners = await qb.getMany();
    return { data: banners };
  }

  async getNotifications(userId?: string, role?: string) {
    const qb = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.status = :status', { status: 'sent' });

    if (role) {
      qb.andWhere(
        '(notification.targetRole IS NULL OR notification.targetRole = :role)',
        { role },
      );
    }

    if (userId) {
      qb.andWhere(
        '(notification.userId IS NULL OR notification.userId = :userId OR notification.targetUserIds IS NULL OR notification.targetUserIds LIKE :userIdPattern)',
        {
          userId,
          userIdPattern: `%${userId}%`,
        },
      );
    }

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
    const rows = await this.settingsRepository.find({
      where: [{ key: 'maintenanceMode' }, { key: 'maintenanceMessage' }],
    });
    const map: Record<string, string> = {};
    rows.forEach((row) => {
      map[row.key] = row.value;
    });

    return {
      maintenanceMode: map.maintenanceMode === 'true',
      message:
        map.maintenanceMode === 'true'
          ? (map.maintenanceMessage ?? 'App is under maintenance. Please try again later.')
          : 'All systems operational',
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
      const newTier = this.calculateElectricianTier(newPoints);

      await this.electricianRepository.update(userId, {
        totalPoints: newPoints,
        totalScans: newScans,
        walletBalance: (user.walletBalance ?? 0) + points,
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
        balanceAfter: (user.walletBalance ?? 0) + points,
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
      await this.electricianRepository.update(existing.id, { dealerId });
      await this.dealerRepository.update(dealerId, {
        electricianCount: (dealer.electricianCount ?? 0) + 1,
      });
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
    await this.dealerRepository.update(dealerId, {
      electricianCount: (dealer.electricianCount ?? 0) + 1,
    });

    return { message: 'Electrician added successfully', electrician: saved };
  }

  private calculateElectricianTier(points: number): string {
    if (points >= 10000) return 'Diamond';
    if (points >= 5001) return 'Platinum';
    if (points >= 1001) return 'Gold';
    return 'Silver';
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

  // ── New methods ────────────────────────────────────────────────────

  async saveBankAccount(userId: string, role: string, body: any) {
    if (role === 'electrician') {
      await this.electricianRepository.update(userId, {
        upiId: body.upiId,
        bankAccount: body.accountNumber,
        ifsc: body.ifsc,
        bankName: body.bankName,
        accountHolderName: body.accountHolderName,
        bankLinked: true,
      } as any);
    } else {
      await this.dealerRepository.update(userId, {
        upiId: body.upiId,
        bankAccount: body.accountNumber,
        ifsc: body.ifsc,
        bankName: body.bankName,
        accountHolderName: body.accountHolderName,
        bankLinked: true,
      } as any);
    }
    return { message: 'Bank account saved successfully' };
  }

  async redeemReward(userId: string, role: string, body: { schemeId: string; note?: string }) {
    const scheme = await this.rewardSchemeRepository.findOne({ where: { id: body.schemeId } });
    if (!scheme) throw new NotFoundException('Reward scheme not found');

    let user: any;
    if (role === 'electrician') {
      user = await this.electricianRepository.findOne({ where: { id: userId } });
    } else {
      user = await this.dealerRepository.findOne({ where: { id: userId } });
    }
    if (!user) throw new NotFoundException('User not found');

    const currentPoints = user.totalPoints ?? user.walletBalance ?? 0;
    if (currentPoints < scheme.pointsCost) {
      throw new BadRequestException('Insufficient points');
    }

    const redemption = this.redemptionRepository.create({
      userId,
      userName: 'User',
      role: role === 'electrician' ? UserRole.ELECTRICIAN : UserRole.DEALER,
      type: scheme.category,
      schemeId: body.schemeId,
      points: scheme.pointsCost,
      amount: scheme.mrp ?? 0,
      status: 'pending' as any,
      note: body.note,
    });
    await this.redemptionRepository.save(redemption);

    // Deduct points
    if (role === 'electrician') {
      await this.electricianRepository.update(userId, {
        totalPoints: Math.max(0, currentPoints - scheme.pointsCost),
        walletBalance: Math.max(0, (user.walletBalance ?? 0) - scheme.pointsCost),
      } as any);
    }

    return { message: 'Redemption request submitted', redemption };
  }

  async transferPoints(userId: string, role: string, body: { receiverPhone: string; points: number }) {
    const receiver = await this.electricianRepository.findOne({ where: { phone: body.receiverPhone } });
    if (!receiver) throw new NotFoundException('Receiver not found');

    let sender: any;
    if (role === 'electrician') {
      sender = await this.electricianRepository.findOne({ where: { id: userId } });
    }
    if (!sender) throw new NotFoundException('Sender not found');

    if ((sender.totalPoints ?? 0) < body.points) {
      throw new BadRequestException('Insufficient points');
    }

    await this.electricianRepository.update(userId, {
      totalPoints: (sender.totalPoints ?? 0) - body.points,
      walletBalance: Math.max(0, (sender.walletBalance ?? 0) - body.points),
    } as any);

    await this.electricianRepository.update(receiver.id, {
      totalPoints: (receiver.totalPoints ?? 0) + body.points,
      walletBalance: (receiver.walletBalance ?? 0) + body.points,
    } as any);

    return { message: `${body.points} points transferred to ${receiver.name}` };
  }

  async getDealerBonus(dealerId: string) {
    const dealer = await this.dealerRepository.findOne({ where: { id: dealerId } });
    if (!dealer) throw new NotFoundException('Dealer not found');

    // Calculate 5% of total electrician points as dealer bonus
    const electricians = await this.electricianRepository.find({ where: { dealerId } });
    const totalElectricianPoints = electricians.reduce((sum, e) => sum + (e.totalPoints ?? 0), 0);
    const availableBonus = Math.floor(totalElectricianPoints * 0.05);

    return {
      availableBonus,
      totalBonus: availableBonus,
      pendingWithdrawals: 0,
    };
  }

  async requestDealerBonusWithdrawal(dealerId: string, amount: number) {
    const dealer = await this.dealerRepository.findOne({ where: { id: dealerId } });
    if (!dealer) throw new NotFoundException('Dealer not found');

    const redemption = this.redemptionRepository.create({
      userId: dealerId,
      userName: dealer.name,
      role: UserRole.DEALER,
      type: 'dealer_bonus',
      points: 0,
      amount,
      status: 'pending' as any,
    });
    await this.redemptionRepository.save(redemption);

    return { message: 'Withdrawal request submitted', redemption };
  }

  async uploadProfilePhoto(userId: string, role: string, base64DataUri: string, source = 'upload') {
    // Store base64 image URL directly (in production, upload to S3/CDN)
    const profileImage = base64DataUri;
    if (role === 'electrician') {
      await this.electricianRepository.update(userId, { profileImage } as any);
    } else {
      await this.dealerRepository.update(userId, { profileImage } as any);
    }
    return { profileImage };
  }

  async removeProfilePhoto(userId: string, role: string) {
    if (role === 'electrician') {
      await this.electricianRepository.update(userId, { profileImage: null } as any);
    } else {
      await this.dealerRepository.update(userId, { profileImage: null } as any);
    }
    return { removed: true };
  }

  async changePassword(userId: string, role: string, body: { currentPassword?: string; newPassword: string }) {
    // Password change — store hashed password
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash(body.newPassword, 10);
    if (role === 'electrician') {
      await this.electricianRepository.update(userId, { passwordHash: hash } as any);
    } else {
      await this.dealerRepository.update(userId, { passwordHash: hash } as any);
    }
    return { message: 'Password updated successfully' };
  }

  async createSupportTicket(userId: string, role: string, body: { subject: string; comment: string; photoUrl?: string }) {
    let userName = 'Unknown';
    if (role === 'electrician') {
      const user = await this.electricianRepository.findOne({ where: { id: userId } });
      userName = user?.name ?? 'Unknown';
    } else {
      const user = await this.dealerRepository.findOne({ where: { id: userId } });
      userName = user?.name ?? 'Unknown';
    }

    const ticket = this.supportTicketRepository.create({
      userId,
      userName,
      userRole: role === 'electrician' ? UserRole.ELECTRICIAN : UserRole.DEALER,
      subject: body.subject,
      message: body.comment,
      photoUrl: body.photoUrl,
    });
    await this.supportTicketRepository.save(ticket);
    return { message: 'Support ticket created', ticket };
  }

  async submitRating(userId: string, role: string, rating: number, review?: string) {
    const userRole = role === 'electrician' ? UserRole.ELECTRICIAN : UserRole.DEALER;
    const existing = await this.appRatingRepository.findOne({ where: { userId, userRole } });
    if (existing) {
      await this.appRatingRepository.update(existing.id, { rating, review });
      return { id: existing.id, rating, review };
    }
    const newRating = this.appRatingRepository.create({ userId, userRole, rating, review });
    const saved = await this.appRatingRepository.save(newRating);
    return { id: saved.id, rating, review };
  }

  async getMyRating(userId: string) {
    const rating = await this.appRatingRepository.findOne({ where: { userId } });
    if (!rating) return null;
    return { id: rating.id, rating: rating.rating, review: rating.review };
  }

  async getRewardSchemes(category?: string) {
    const qb = this.rewardSchemeRepository
      .createQueryBuilder('scheme')
      .where('scheme.active = :active', { active: true });
    if (category) {
      qb.andWhere('scheme.category = :category', { category });
    }
    qb.orderBy('scheme.sortOrder', 'ASC');
    const data = await qb.getMany();
    return { data };
  }

  async getFestivalTheme(timezone?: string) {
    const tz = timezone ?? 'Asia/Kolkata';
    const now = new Date();
    // Get current date string in YYYY-MM-DD in the given timezone
    const currentDate = now.toLocaleDateString('en-CA', { timeZone: tz }); // en-CA gives YYYY-MM-DD

    const festivals = await this.festivalRepository.find({
      where: { active: true },
      order: { startDate: 'ASC' },
    });

    const festival = festivals.find((f) => {
      const start = f.startDate ? String(f.startDate).slice(0, 10) : null;
      const end = f.endDate ? String(f.endDate).slice(0, 10) : null;
      if (!start || !end) return false;
      return currentDate >= start && currentDate <= end;
    });

    if (!festival) {
      return {
        active: false,
        source: 'none',
        timezone: tz,
        currentDate,
        serverTime: now.toISOString(),
        id: null,
        name: null,
        slug: null,
        greeting: null,
        subGreeting: null,
        emoji: null,
        bannerEmojis: '',
        particleEmojis: '',
        theme: {
          primaryColor: '#E8453C',
          secondaryColor: '#FF6B5B',
          accentColor: '#FFFFFF',
          bgColor: '#FFF5F5',
          cardColor: '#FFFFFF',
          textColor: '#1A1A1A',
        },
        startDate: null,
        endDate: null,
      };
    }

    return {
      active: true,
      source: 'festival',
      timezone: tz,
      currentDate,
      serverTime: now.toISOString(),
      id: festival.id,
      name: festival.name,
      slug: festival.slug,
      greeting: festival.greeting,
      subGreeting: festival.subGreeting,
      emoji: festival.emoji,
      bannerEmojis: festival.bannerEmojis ?? '',
      particleEmojis: festival.particleEmojis ?? '',
      theme: {
        primaryColor: festival.primaryColor,
        secondaryColor: festival.secondaryColor,
        accentColor: festival.accentColor,
        bgColor: festival.bgColor,
        cardColor: festival.cardColor,
        textColor: festival.textColor,
      },
      startDate: festival.startDate,
      endDate: festival.endDate,
    };
  }
}
