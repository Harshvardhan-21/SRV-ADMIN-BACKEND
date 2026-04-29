import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import {
  MemberTier,
  NotificationStatus,
  RedemptionStatus,
  ScanMode,
  TransactionSource,
  TransactionType,
  UserRole,
  UserStatus,
} from '../../common/enums';
import { Dealer } from '../../database/entities/dealer.entity';
import { Electrician } from '../../database/entities/electrician.entity';
import { Product } from '../../database/entities/product.entity';
import { ProductCategory } from '../../database/entities/product-category.entity';
import { RewardScheme } from '../../database/entities/reward-scheme.entity';
import { Offer } from '../../database/entities/offer.entity';
import { Settings } from '../../database/entities/settings.entity';
import { Festival } from '../../database/entities/festival.entity';
import { Testimonial } from '../../database/entities/testimonial.entity';
import { Notification } from '../../database/entities/notification.entity';
import { SupportTicket } from '../../database/entities/support-ticket.entity';
import { UserProfileImage } from '../../database/entities/user-profile-image.entity';
import { UserQrCode } from '../../database/entities/user-qr-code.entity';
import { AppRating } from '../../database/entities/app-rating.entity';
import { Wallet } from '../../database/entities/wallet.entity';
import { Redemption } from '../../database/entities/redemption.entity';
import { Scan } from '../../database/entities/scan.entity';
import { QrCode } from '../../database/entities/qr-code.entity';
import { OtpCode } from '../../database/entities/otp-code.entity';

@Injectable()
export class AppCompatService {
  constructor(
    @InjectRepository(Dealer)
    private readonly dealerRepository: Repository<Dealer>,
    @InjectRepository(Electrician)
    private readonly electricianRepository: Repository<Electrician>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductCategory)
    private readonly productCategoryRepository: Repository<ProductCategory>,
    @InjectRepository(RewardScheme)
    private readonly rewardSchemeRepository: Repository<RewardScheme>,
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    @InjectRepository(Settings)
    private readonly settingsRepository: Repository<Settings>,
    @InjectRepository(Festival)
    private readonly festivalRepository: Repository<Festival>,
    @InjectRepository(Testimonial)
    private readonly testimonialRepository: Repository<Testimonial>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(SupportTicket)
    private readonly supportTicketRepository: Repository<SupportTicket>,
    @InjectRepository(UserProfileImage)
    private readonly userProfileImageRepository: Repository<UserProfileImage>,
    @InjectRepository(UserQrCode)
    private readonly userQrCodeRepository: Repository<UserQrCode>,
    @InjectRepository(AppRating)
    private readonly appRatingRepository: Repository<AppRating>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(Redemption)
    private readonly redemptionRepository: Repository<Redemption>,
    @InjectRepository(Scan)
    private readonly scanRepository: Repository<Scan>,
    @InjectRepository(QrCode)
    private readonly qrCodeRepository: Repository<QrCode>,
    @InjectRepository(OtpCode)
    private readonly otpCodeRepository: Repository<OtpCode>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async sendOtp(body: any) {
    const phone = String(body?.phone ?? '').trim();
    const purpose = String(body?.purpose ?? 'LOGIN').trim().toUpperCase();
    if (!phone) {
      throw new BadRequestException('Phone is required.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.otpCodeRepository.delete({ phone, purpose });
    await this.otpCodeRepository.save(
      this.otpCodeRepository.create({
        phone,
        purpose,
        code: otp,
        verified: false,
        expiresAt,
      }),
    );

    console.log(`[OTP] Phone: ${phone}, Purpose: ${purpose}, OTP: ${otp}`);

    return {
      success: true,
      message: `OTP sent to +91 ${phone}.`,
      expiresInSeconds: 300,
    };
  }

  async verifyOtp(body: any) {
    const phone = String(body?.phone ?? '').trim();
    const otp = String(body?.otp ?? '').trim();
    const purpose = String(body?.purpose ?? 'LOGIN').trim().toUpperCase();
    await this.assertOtp(phone, otp, purpose, false);
    return { verified: true, message: 'OTP verified successfully.' };
  }

  async loginWithOtp(body: any) {
    const phone = String(body?.phone ?? '').trim();
    const otp = String(body?.otp ?? '').trim();
    const role = this.normalizeRole(body?.role);
    await this.assertOtp(phone, otp, 'LOGIN', true);
    const user = await this.findActiveUserByPhone(phone, role, true);
    return this.sessionFromUser(user, role);
  }

  async loginWithPassword(body: any) {
    const phone = String(body?.phone ?? '').trim();
    const password = String(body?.password ?? '');
    const role = this.normalizeRole(body?.role);
    const user = await this.findActiveUserByPhone(phone, role, true, true);

    if (!user.passwordHash) {
      throw new UnauthorizedException('Password login is not configured.');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid phone number or password.');
    }

    return this.sessionFromUser(user, role);
  }

  async signupElectrician(body: any) {
    const phone = String(body?.phone ?? '').trim();
    const dealerPhone = String(body?.dealerPhone ?? '').trim();
    if (!phone || !dealerPhone) {
      throw new BadRequestException('Phone and dealerPhone are required.');
    }
    if (phone === dealerPhone) {
      throw new BadRequestException('Dealer number cannot be same as your phone number.');
    }

    await this.assertOtp(phone, String(body?.otp ?? '').trim(), 'SIGNUP', true);

    const existing = await this.electricianRepository.findOne({ where: { phone } });
    if (existing) {
      throw new ConflictException('This mobile number is already registered.');
    }

    const dealer = await this.dealerRepository.findOne({
      where: { phone: dealerPhone, status: UserStatus.ACTIVE },
      select: ['id', 'name', 'phone', 'state', 'district', 'town', 'pincode'],
    });
    if (!dealer) {
      throw new BadRequestException('Please verify the dealer number before continuing.');
    }

    const passwordHash = body?.password ? await bcrypt.hash(String(body.password), 12) : null;
    const electrician = this.electricianRepository.create({
      name: String(body?.fullName ?? body?.name ?? '').trim(),
      phone,
      email: body?.email ? String(body.email).trim().toLowerCase() : null,
      passwordHash,
      address: String(body?.address ?? '').trim() || null,
      state: String(body?.state ?? dealer.state ?? '').trim() || null,
      city: String(body?.city ?? dealer.town ?? '').trim() || null,
      district: String(body?.district ?? dealer.district ?? '').trim() || null,
      pincode: body?.pincode ? String(body.pincode).trim() : dealer.pincode,
      electricianCode: await this.nextElectricianCode(body?.state ?? dealer.state),
      dealerId: dealer.id,
      status: UserStatus.ACTIVE,
      totalPoints: 0,
      walletBalance: 0,
      totalScans: 0,
    });

    const saved = await this.electricianRepository.save(electrician);
    await this.dealerRepository.update(dealer.id, {
      electricianCount: (await this.electricianRepository.count({ where: { dealerId: dealer.id } })),
    });
    return this.sessionFromUser(saved, 'electrician');
  }

  async signupDealer(body: any) {
    const phone = String(body?.phone ?? '').trim();
    if (!phone) {
      throw new BadRequestException('Phone is required.');
    }

    await this.assertOtp(phone, String(body?.otp ?? '').trim(), 'SIGNUP', true);

    const existing = await this.dealerRepository.findOne({ where: { phone } });
    if (existing) {
      throw new ConflictException('This mobile number is already registered.');
    }

    const passwordHash = body?.password ? await bcrypt.hash(String(body.password), 12) : null;
    const dealer = this.dealerRepository.create({
      name: String(body?.fullName ?? body?.name ?? '').trim(),
      phone,
      email: body?.email ? String(body.email).trim().toLowerCase() : null,
      passwordHash,
      address: String(body?.address ?? '').trim(),
      state: String(body?.state ?? '').trim(),
      town: String(body?.city ?? body?.town ?? '').trim(),
      district: String(body?.district ?? '').trim(),
      pincode: body?.pincode ? String(body.pincode).trim() : null,
      gstNumber: body?.gstNumber ? String(body.gstNumber).trim().toUpperCase() : null,
      contactPerson: body?.gstHolderName ? String(body.gstHolderName).trim() : null,
      dealerCode: await this.nextDealerCode(body?.state),
      status: UserStatus.PENDING,
    });

    const saved = await this.dealerRepository.save(dealer);
    return {
      pendingApproval: true,
      message: 'Waiting for approve. Your request has been sent to admin panel.',
      dealerId: saved.id,
    };
  }

  async refresh(body: any) {
    const refreshToken = String(body?.refreshToken ?? '').trim();
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token.');
    }
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
      const role = this.normalizeRole(payload.role);
      const user = await this.findUserById(payload.sub, role, true);
      return this.sessionFromUser(user, role);
    } catch {
      throw new UnauthorizedException('Invalid refresh token.');
    }
  }

  async categories() {
    let categories = await this.productCategoryRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', label: 'ASC' },
    });

    if (!categories.length) {
      const distinct = await this.productRepository
        .createQueryBuilder('product')
        .select('DISTINCT product.category', 'category')
        .where('product.isActive = :isActive', { isActive: true })
        .andWhere("COALESCE(product.category, '') <> ''")
        .orderBy('category', 'ASC')
        .getRawMany();

      categories = distinct.map((row: any) =>
        this.productCategoryRepository.create({
          label: row.category,
          glyph: null,
          imageUrl: null,
          isActive: true,
        }),
      );
      if (categories.length) {
        categories = await this.productCategoryRepository.save(categories);
      }
    }

    const products = await this.productRepository.find({ where: { isActive: true } });

    return categories.map((category) => {
      const items = products
        .filter((product) => product.category?.toLowerCase() === category.label.toLowerCase())
        .map((product) => this.toPublicProduct(product, category.id, category));

      return {
        id: category.id,
        categoryId: category.id,
        label: category.label,
        glyph: category.glyph,
        imageUrl: category.imageUrl,
        productCount: items.length,
        hasProducts: items.length > 0,
        products: items,
      };
    });
  }

  async products(search?: string, categoryId?: string) {
    const qb = this.productRepository
      .createQueryBuilder('product')
      .where('product.isActive = :isActive', { isActive: true });

    let category: ProductCategory | null = null;
    if (categoryId && categoryId !== 'all') {
      category = await this.productCategoryRepository.findOne({
        where: [{ id: categoryId }, { label: categoryId }],
      });
      if (category) {
        qb.andWhere('LOWER(product.category) = LOWER(:category)', { category: category.label });
      } else {
        qb.andWhere('LOWER(product.category) = LOWER(:category)', { category: categoryId });
      }
    }

    if (search) {
      qb.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.sub ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const products = await qb.orderBy('product.name', 'ASC').getMany();
    return products.map((product) =>
      this.toPublicProduct(product, category?.id, category ?? undefined),
    );
  }

  async productById(id: string) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      return null;
    }
    const category = await this.productCategoryRepository.findOne({
      where: { label: product.category },
    });
    return this.toPublicProduct(product, category?.id, category ?? undefined);
  }

  async rewardSchemes(category?: string, role?: string, storeCategory?: string) {
    const qb = this.rewardSchemeRepository
      .createQueryBuilder('rewardScheme')
      .where('rewardScheme.active = :active', { active: true });

    if (category) {
      qb.andWhere('LOWER(rewardScheme.category) = LOWER(:category)', { category });
    }
    if (storeCategory) {
      qb.andWhere('LOWER(COALESCE(rewardScheme.storeCategory, rewardScheme.category)) = LOWER(:storeCategory)', {
        storeCategory,
      });
    }
    if (role) {
      qb.andWhere('(rewardScheme.targetRole IS NULL OR UPPER(rewardScheme.targetRole) = :role)', {
        role: String(role).toUpperCase(),
      });
    }

    return qb.orderBy('rewardScheme.sortOrder', 'ASC')
      .addOrderBy('rewardScheme.pointsCost', 'ASC')
      .getMany();
  }

  async rewardStore(role?: string) {
    const items = await this.rewardSchemes(undefined, role);
    const settings = await this.settings();
    const categories = Array.from(
      new Map(
        items.map((item) => [
          item.storeCategory || item.category,
          {
            id: item.legacyCategoryId || (item.storeCategory || item.category).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            label: item.storeCategory || item.category,
          },
        ]),
      ).values(),
    ).map((category) => ({
      ...category,
      count: items.filter((item) => (item.storeCategory || item.category) === category.label).length,
    }));

    return {
      role: String(role || 'ELECTRICIAN').toUpperCase(),
      policy: {
        title: settings.gift_store_policy_title || 'SRV Gift Store Policy',
        body: settings.gift_store_policy_body || 'Redeem points against available SRV rewards.',
        imageUrl: settings.gift_store_policy_image_url || null,
        shippingNote: settings.gift_store_shipping_note || null,
        supportPhone: settings.gift_store_support_phone || null,
        minimumRedeemPoints: Number(settings.gift_store_minimum_redeem_points || 0),
      },
      categories,
      items,
    };
  }

  async testimonials(role?: string) {
    const rows = await this.testimonialRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });

    return rows
      .filter((row) => !role || row.userCategory === 'all' || row.userCategory?.toUpperCase() === String(role).toUpperCase())
      .map((row) => ({
        id: row.id,
        name: row.name || row.personName,
        initials: row.initials || this.getInitials(row.personName),
        location: row.location,
        tier: row.tier,
        yearsWithUs: String(row.yearsConnected),
        quote: row.quote || row.content,
        highlight: row.highlight,
        role: row.userCategory?.toUpperCase() || 'ALL',
        colors: (row.gradientColors?.length ? row.gradientColors : ['#FDE68A', '#F59E0B', '#B45309']) as [string, string, string],
        ring: row.ringColor || '#F59E0B',
        glow: row.highlight || row.ringColor || '#FDE68A',
      }));
  }

  async settings() {
    const rows = await this.settingsRepository.find({ order: { key: 'ASC' } });
    const map: Record<string, string> = {};
    rows.forEach((row) => {
      map[row.key] = row.value;
    });
    const avg = await this.appRatingRepository
      .createQueryBuilder('rating')
      .select('AVG(rating.rating)', 'avg')
      .getRawOne();
    if (avg?.avg) {
      map.app_rating_avg = Number(avg.avg).toFixed(1);
    }
    return map;
  }

  async activeFestival(timezone?: string) {
    const resolvedTimezone = this.normalizeTimezone(timezone);
    const currentDate = this.dateKey(new Date(), resolvedTimezone);
    const festivals = await this.festivalRepository.find({
      where: { active: true },
      order: { startDate: 'ASC' },
    });

    const festival = festivals.find((item) => {
      const startKey = this.festivalDateKey(item.startDate);
      const endKey = this.festivalDateKey(item.endDate);
      return currentDate >= startKey && currentDate <= endKey;
    });

    if (!festival) {
      return this.defaultFestivalTheme(resolvedTimezone, currentDate);
    }

    return {
      active: true,
      source: 'festival',
      timezone: resolvedTimezone,
      currentDate,
      serverTime: new Date().toISOString(),
      id: festival.id,
      name: festival.name,
      slug: festival.slug,
      greeting: festival.greeting,
      subGreeting: festival.subGreeting,
      emoji: festival.emoji,
      bannerEmojis: festival.bannerEmojis,
      particleEmojis: festival.particleEmojis,
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

  async upcomingFestivals(timezone?: string) {
    const resolvedTimezone = this.normalizeTimezone(timezone);
    const currentDate = this.dateKey(new Date(), resolvedTimezone);
    const festivals = await this.festivalRepository.find({
      where: { active: true },
      order: { startDate: 'ASC' },
    });

    return festivals
      .filter((item) => this.festivalDateKey(item.startDate) > currentDate)
      .slice(0, 10)
      .map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        emoji: item.emoji,
        greeting: item.greeting,
        startDate: item.startDate,
        endDate: item.endDate,
      }));
  }

  async verifyDealer(body: any) {
    const dealerPhone = String(body?.dealerPhone ?? '').trim();
    const ownPhone = String(body?.ownPhone ?? '').trim();
    if (!dealerPhone || !ownPhone) {
      throw new BadRequestException('Dealer phone and own phone are required.');
    }
    if (dealerPhone === ownPhone) {
      throw new BadRequestException('Dealer number cannot be same as your phone number.');
    }

    const dealer = await this.dealerRepository.findOne({
      where: { phone: dealerPhone, status: UserStatus.ACTIVE },
    });
    if (!dealer) {
      throw new NotFoundException('Please enter correct dealer number.');
    }

    return {
      verified: true,
      dealer: {
        id: dealer.id,
        fullName: dealer.name,
        phone: dealer.phone,
        city: dealer.town,
        state: dealer.state,
        dealerCode: dealer.dealerCode,
      },
    };
  }

  async dealerElectricians(dealerId: string, search?: string) {
    const qb = this.electricianRepository
      .createQueryBuilder('electrician')
      .where('electrician.dealerId = :dealerId', { dealerId });

    if (search) {
      qb.andWhere(
        '(electrician.name ILIKE :search OR electrician.phone ILIKE :search OR electrician.city ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const electricians = await qb.orderBy('electrician.joinedDate', 'DESC').getMany();
    return electricians.map((electrician) => ({
      id: `${dealerId}:${electrician.id}`,
      dealerId,
      electricianId: electrician.id,
      status: 'ACTIVE',
      joinedAt: electrician.joinedDate,
      electrician: {
        id: electrician.id,
        fullName: electrician.name,
        phone: electrician.phone,
        city: electrician.city,
        state: electrician.state,
        pointsBalance: electrician.walletBalance,
        scanCount: electrician.totalScans,
      },
    }));
  }

  async inviteElectrician(dealerId: string, body: any) {
    const phone = String(body?.phone ?? '').trim();
    if (!phone) {
      throw new BadRequestException('Phone is required.');
    }

    const existing = await this.electricianRepository.findOne({ where: { phone } });
    if (existing && existing.dealerId === dealerId) {
      throw new ConflictException('Electrician is already connected to this dealer.');
    }

    return this.sendOtp({ phone, purpose: 'ADD_ELECTRICIAN' });
  }

  async verifyElectricianInvite(dealerId: string, body: any) {
    const phone = String(body?.phone ?? '').trim();
    await this.assertOtp(phone, String(body?.otp ?? '').trim(), 'ADD_ELECTRICIAN', true);

    const dealer = await this.dealerRepository.findOne({ where: { id: dealerId } });
    if (!dealer) {
      throw new NotFoundException('Dealer not found.');
    }

    let electrician = await this.electricianRepository
      .createQueryBuilder('electrician')
      .addSelect('electrician.passwordHash')
      .where('electrician.phone = :phone', { phone })
      .getOne();

    if (!electrician) {
      electrician = this.electricianRepository.create({
        name: String(body?.fullName ?? '').trim(),
        phone,
        city: String(body?.city ?? dealer.town ?? '').trim(),
        state: dealer.state,
        district: dealer.district,
        pincode: dealer.pincode,
        electricianCode: await this.nextElectricianCode(dealer.state),
        dealerId,
        status: UserStatus.ACTIVE,
      });
      electrician = await this.electricianRepository.save(electrician);
    } else {
      await this.electricianRepository.update(electrician.id, {
        name: String(body?.fullName ?? electrician.name ?? '').trim(),
        city: String(body?.city ?? electrician.city ?? dealer.town ?? '').trim(),
        state: electrician.state || dealer.state,
        district: electrician.district || dealer.district,
        pincode: electrician.pincode || dealer.pincode,
        dealerId,
        status: UserStatus.ACTIVE,
      });
      electrician = await this.electricianRepository.findOne({ where: { id: electrician.id } });
    }

    await this.dealerRepository.update(dealerId, {
      electricianCount: await this.electricianRepository.count({ where: { dealerId } }),
    });

    return {
      id: `${dealerId}:${electrician!.id}`,
      dealerId,
      electricianId: electrician!.id,
      status: 'ACTIVE',
      joinedAt: electrician!.joinedDate,
      electrician: {
        id: electrician!.id,
        fullName: electrician!.name,
        phone: electrician!.phone,
        city: electrician!.city,
        state: electrician!.state,
        pointsBalance: electrician!.walletBalance,
        scanCount: electrician!.totalScans,
      },
    };
  }

  async callList(dealerId: string) {
    const electricians = await this.electricianRepository.find({
      where: { dealerId },
      order: { joinedDate: 'DESC' },
      take: 10,
    });
    if (!electricians.length) {
      throw new NotFoundException('No electricians connected yet.');
    }
    return electricians.map((electrician) => ({
      id: electrician.id,
      name: electrician.name,
      phone: electrician.phone,
      whatsapp: `91${electrician.phone}`,
      city: electrician.city,
      status: 'ACTIVE',
    }));
  }

  async approveDealer(body: any) {
    const phone = String(body?.phone ?? '').trim();
    const dealerCode = String(body?.dealerCode ?? '').trim().toUpperCase();
    const dealer = await this.dealerRepository.findOne({ where: { phone } });
    if (!dealer) {
      throw new NotFoundException('Dealer not found.');
    }
    await this.dealerRepository.update(dealer.id, {
      status: UserStatus.ACTIVE,
      dealerCode: dealerCode || dealer.dealerCode,
    });
    await this.createUserNotification(dealer.id, 'dealer', {
      title: 'Dealer account approved',
      body: `Your account is approved. Dealer code: ${dealerCode || dealer.dealerCode}.`,
      type: 'DealerApproval',
    });
    return this.dealerRepository.findOne({ where: { id: dealer.id } });
  }

  async updateProfile(userId: string, roleInput: string, body: any) {
    const role = this.normalizeRole(roleInput);
    if (role === 'electrician') {
      await this.electricianRepository.update(userId, {
        name: body?.fullName ?? body?.name,
        email: body?.email,
        city: body?.city,
        state: body?.state,
        district: body?.district,
        pincode: body?.pincode,
        address: body?.address,
        upiId: body?.upiId,
        bankAccount: body?.bankAccount,
        ifsc: body?.ifsc,
        bankName: body?.bankName,
        accountHolderName: body?.accountHolderName,
        language: body?.language,
        ...(body?.darkMode !== undefined ? { darkMode: Boolean(body.darkMode) } : {}),
        ...(body?.pushEnabled !== undefined ? { pushEnabled: Boolean(body.pushEnabled) } : {}),
        ...(body?.profileImage !== undefined ? { profileImage: body.profileImage } : {}),
      });
    } else {
      await this.dealerRepository.update(userId, {
        name: body?.fullName ?? body?.name,
        email: body?.email,
        town: body?.city ?? body?.town,
        state: body?.state,
        district: body?.district,
        pincode: body?.pincode,
        address: body?.address,
        gstNumber: body?.gstNumber,
        contactPerson: body?.gstHolderName ?? body?.contactPerson,
        upiId: body?.upiId,
        bankAccount: body?.bankAccount,
        ifsc: body?.ifsc,
        bankName: body?.bankName,
        accountHolderName: body?.accountHolderName,
        language: body?.language,
        ...(body?.darkMode !== undefined ? { darkMode: Boolean(body.darkMode) } : {}),
        ...(body?.pushEnabled !== undefined ? { pushEnabled: Boolean(body.pushEnabled) } : {}),
        ...(body?.profileImage !== undefined ? { profileImage: body.profileImage } : {}),
      });
    }

    return this.me(userId, role);
  }

  async changePassword(userId: string, roleInput: string, body: any) {
    const role = this.normalizeRole(roleInput);
    const repo = this.getRepo(role);
    const user = await repo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (user.passwordHash) {
      if (!body?.currentPassword) {
        throw new BadRequestException('Current password is required.');
      }
      const ok = await bcrypt.compare(String(body.currentPassword), user.passwordHash);
      if (!ok) {
        throw new UnauthorizedException('Current password is incorrect.');
      }
    }

    const passwordHash = await bcrypt.hash(String(body?.newPassword ?? ''), 12);
    await repo.update(userId, { passwordHash } as any);
    return { changed: true };
  }

  async updatePhoto(userId: string, roleInput: string, body: any) {
    const role = this.normalizeRole(roleInput);
    const imageData = String(body?.profileImage ?? '').trim();
    if (!imageData) {
      throw new BadRequestException('Image data is required.');
    }

    const mimeType = imageData.startsWith('data:image/png')
      ? 'image/png'
      : imageData.startsWith('data:image/webp')
        ? 'image/webp'
        : imageData.startsWith('data:image/gif')
          ? 'image/gif'
          : 'image/jpeg';

    await this.userProfileImageRepository.update(
      { userId, userRole: this.toUserRoleEnum(role), isCurrent: true },
      { isCurrent: false },
    );

    const image = await this.userProfileImageRepository.save(
      this.userProfileImageRepository.create({
        userId,
        userRole: this.toUserRoleEnum(role),
        imageData,
        mimeType,
        isCurrent: true,
        source: body?.source ?? 'upload',
      }),
    );

    await this.getRepo(role).update(userId, { profileImage: imageData } as any);

    return {
      id: image.id,
      userId,
      mimeType: image.mimeType,
      isCurrent: image.isCurrent,
      source: image.source,
      createdAt: image.createdAt,
      imageData,
    };
  }

  async removePhoto(userId: string, roleInput: string) {
    const role = this.normalizeRole(roleInput);
    await this.userProfileImageRepository.update(
      { userId, userRole: this.toUserRoleEnum(role) },
      { isCurrent: false },
    );
    await this.getRepo(role).update(userId, { profileImage: null } as any);
    return { removed: true };
  }

  async photoHistory(userId: string, roleInput: string) {
    const role = this.normalizeRole(roleInput);
    return this.userProfileImageRepository.find({
      where: { userId, userRole: this.toUserRoleEnum(role) },
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }

  async qrCode(userId: string, roleInput: string) {
    const role = this.normalizeRole(roleInput);
    const user = await this.findUserById(userId, role);
    let qrValue: string;
    if (role === 'electrician') {
      qrValue = (user as Electrician).electricianCode || user.phone;
    } else {
      qrValue = (user as Dealer).dealerCode || user.phone;
    }

    let record = await this.userQrCodeRepository.findOne({
      where: { userId, userRole: this.toUserRoleEnum(role) },
    });
    if (!record) {
      record = await this.userQrCodeRepository.save(
        this.userQrCodeRepository.create({
          userId,
          userRole: this.toUserRoleEnum(role),
          qrValue,
        }),
      );
    } else if (record.qrValue !== qrValue) {
      await this.userQrCodeRepository.update(record.id, { qrValue });
      record = await this.userQrCodeRepository.findOne({ where: { id: record.id } });
    }

    return {
      id: record!.id,
      userId,
      qrValue: record!.qrValue,
      qrImageUrl: record!.qrImageUrl,
      generatedAt: record!.generatedAt,
      updatedAt: record!.updatedAt,
      qrApiUrl: this.buildQrImageUrl(record!.qrValue),
      storedQrImageUrl: record!.qrImageUrl ?? null,
    };
  }

  async profileNotifications(userId: string, roleInput: string) {
    const role = this.normalizeRole(roleInput);
    return this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orWhere('notification.userId IS NULL AND notification.status = :status AND (notification.targetRole IS NULL OR LOWER(notification.targetRole) = :role)', {
        status: NotificationStatus.SENT,
        role,
      })
      .orderBy('COALESCE(notification.sentAt, notification.createdAt)', 'DESC')
      .getMany();
  }

  async markNotificationRead(userId: string, id: string) {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }
    if (notification.userId && notification.userId !== userId) {
      throw new UnauthorizedException('Notification does not belong to you.');
    }
    await this.notificationRepository.update(id, { readAt: new Date() });
    return { read: true };
  }

  async createSupport(userId: string, roleInput: string, body: any) {
    const role = this.normalizeRole(roleInput);
    const user = await this.findUserById(userId, role);
    const ticket = await this.supportTicketRepository.save(
      this.supportTicketRepository.create({
        userId,
        userName: this.userName(user),
        userRole: this.toUserRoleEnum(role),
        subject: String(body?.subject ?? '').trim(),
        message: String(body?.comment ?? body?.message ?? '').trim(),
        photoUrl: body?.photoUrl ?? null,
      }),
    );
    await this.createUserNotification(userId, role, {
      title: 'Support ticket raised',
      body: `Ticket "${ticket.subject}" was created successfully.`,
      type: 'Support',
    });
    return ticket;
  }

  async orders(userId: string) {
    const rows = await this.redemptionRepository.find({
      where: { userId },
      order: { requestedAt: 'DESC' },
      take: 25,
    });

    const user = await this.findAnyUserById(userId);
    return rows.map((row) => ({
      id: `ORD-${row.id.slice(-6).toUpperCase()}`,
      status: row.status,
      title: row.note || row.type || 'Reward redemption',
      userId: row.userId,
      userName: user ? this.userName(user) : 'User',
      points: row.points,
      deliveredAt: row.processedAt,
      createdAt: row.requestedAt,
    }));
  }

  async profileOffers() {
    const schemes = await this.rewardSchemeRepository.find({
      where: { active: true },
      order: { sortOrder: 'ASC', pointsCost: 'ASC' },
      take: 6,
    });
    return schemes.map((scheme, index) => ({
      id: `offer-${scheme.id}`,
      tag: index === 0 ? 'Hot' : index < 3 ? 'Live' : 'New',
      title: scheme.name,
      description: scheme.description,
      pointsCost: scheme.pointsCost,
      imageUrl: scheme.imageUrl,
      category: scheme.category,
      mrp: scheme.mrp,
    }));
  }

  async referral(userId: string, roleInput: string) {
    const role = this.normalizeRole(roleInput);
    const user = await this.findUserById(userId, role);
    let code: string;
    if (role === 'electrician') {
      code = (user as Electrician).electricianCode || userId.slice(-6).toUpperCase();
    } else {
      code = (user as Dealer).dealerCode || userId.slice(-6).toUpperCase();
    }
    const publicBaseUrl = String(this.configService.get('APP_PUBLIC_BASE_URL') || '').trim();
    return {
      code,
      link: publicBaseUrl ? `${publicBaseUrl.replace(/\/$/, '')}/ref/${code}` : null,
      channels: ['WhatsApp', 'Message', 'Share'],
    };
  }

  async submitRating(userId: string, roleInput: string, body: any) {
    const rating = Number(body?.rating);
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5.');
    }
    const role = this.normalizeRole(roleInput);
    const existing = await this.appRatingRepository.findOne({
      where: { userId, userRole: this.toUserRoleEnum(role) },
    });
    if (existing) {
      await this.appRatingRepository.update(existing.id, {
        rating,
        review: body?.review ? String(body.review).trim() : null,
      });
      return this.appRatingRepository.findOne({ where: { id: existing.id } });
    }
    return this.appRatingRepository.save(
      this.appRatingRepository.create({
        userId,
        userRole: this.toUserRoleEnum(role),
        rating,
        review: body?.review ? String(body.review).trim() : null,
      }),
    );
  }

  async myRating(userId: string, roleInput: string) {
    const role = this.normalizeRole(roleInput);
    return this.appRatingRepository.findOne({
      where: { userId, userRole: this.toUserRoleEnum(role) },
    });
  }

  async claim(userId: string, roleInput: string, body: any) {
    const role = this.normalizeRole(roleInput);
    if (role !== 'electrician') {
      throw new BadRequestException('Only electricians can claim scan rewards.');
    }

    const rawPayload = String(body?.qrCode ?? '').trim();
    if (!rawPayload) {
      throw new BadRequestException('QR code is required.');
    }

    const code = this.extractQrCode(rawPayload);
    const qr = await this.qrCodeRepository.findOne({
      where: { code, isActive: true },
      relations: ['product'],
    });
    if (!qr || !qr.product) {
      throw new BadRequestException('This QR code is not registered for any SRV product.');
    }

    if (qr.isScanned && (body?.mode ?? 'single') === 'single') {
      throw new ConflictException('This single-use QR code has already been claimed.');
    }

    const existing = await this.scanRepository.findOne({
      where: { userId, qrCodeId: qr.id },
    });
    if (existing && (body?.mode ?? 'single') === 'single') {
      throw new ConflictException('This QR code has already been claimed.');
    }

    const electrician = await this.electricianRepository.findOne({ where: { id: userId } });
    if (!electrician) {
      throw new NotFoundException('Electrician not found.');
    }

    const points = Number(qr.product.points || 0);
    const scan = await this.scanRepository.save(
      this.scanRepository.create({
        userId,
        userName: electrician.name,
        role: UserRole.ELECTRICIAN,
        productId: qr.product.id,
        productName: qr.product.name,
        points,
        mode: (body?.mode === 'multi' ? ScanMode.MULTI : ScanMode.SINGLE),
        qrCodeId: qr.id,
      }),
    );

    await this.qrCodeRepository.update(qr.id, {
      isScanned: body?.mode === 'multi' ? qr.isScanned : true,
      scanCount: (qr.scanCount ?? 0) + 1,
      lastScannedBy: userId,
      lastScannedAt: new Date(),
    });

    await this.productRepository.update(qr.product.id, {
      totalScanned: (qr.product.totalScanned ?? 0) + 1,
    });

    await this.electricianRepository.update(userId, {
      totalPoints: (electrician.totalPoints ?? 0) + points,
      walletBalance: (electrician.walletBalance ?? 0) + points,
      totalScans: (electrician.totalScans ?? 0) + 1,
      tier: this.memberTier((electrician.totalPoints ?? 0) + points),
      lastActivityAt: new Date(),
    });

    await this.walletRepository.save(
      this.walletRepository.create({
        userId,
        userRole: UserRole.ELECTRICIAN,
        type: TransactionType.CREDIT,
        source: TransactionSource.SCAN,
        amount: points,
        balanceBefore: electrician.walletBalance ?? 0,
        balanceAfter: (electrician.walletBalance ?? 0) + points,
        description: `${qr.product.name} scanned`,
        referenceId: scan.id,
        referenceType: 'scan',
      }),
    );

    await this.createUserNotification(userId, role, {
      title: 'Scan reward credited',
      body: `${points} points added for ${qr.product.name}.`,
      type: 'Scan',
    });

    return {
      id: scan.id,
      qrCode: code,
      productId: qr.product.id,
      productName: qr.product.name,
      points: scan.points,
      mode: scan.mode,
      createdAt: scan.scannedAt,
    };
  }

  async scanHistory(userId: string) {
    return this.scanRepository.find({
      where: { userId },
      order: { scannedAt: 'DESC' },
    });
  }

  async me(userId: string, roleInput: string) {
    const role = this.normalizeRole(roleInput);
    const user = await this.findUserById(userId, role, true) as Electrician;
    const unreadNotificationCount = await this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .andWhere('notification.readAt IS NULL')
      .getCount();
    const recentNotifications = await this.profileNotifications(userId, role);
    const currentImage = await this.userProfileImageRepository.findOne({
      where: { userId, userRole: this.toUserRoleEnum(role), isCurrent: true },
      order: { createdAt: 'DESC' },
    });
    const qr = await this.qrCode(userId, role);

    if (role === 'electrician') {
      const dealer = (user as Electrician).dealerId
        ? await this.dealerRepository.findOne({ where: { id: (user as Electrician).dealerId } })
        : null;
      return {
        id: user.id,
        role: 'ELECTRICIAN',
        status: user.status,
        fullName: user.name,
        hasPasswordConfigured: Boolean((user as Electrician).passwordHash),
        phone: user.phone,
        email: (user as Electrician).email,
        language: (user as Electrician).language,
        darkMode: (user as Electrician).darkMode,
        pushEnabled: (user as Electrician).pushEnabled,
        address: (user as Electrician).address,
        state: (user as Electrician).state,
        city: (user as Electrician).city,
        pincode: (user as Electrician).pincode,
        electricianCode: (user as Electrician).electricianCode,
        dealerCode: dealer?.dealerCode ?? null,
        gstNumber: null,
        gstHolderName: null,
        panNumber: (user as Electrician).panNumber,
        panHolderName: (user as Electrician).accountHolderName ?? null,
        profileImage: currentImage?.imageData ?? (user as Electrician).profileImage ?? null,
        pointsBalance: (user as Electrician).walletBalance ?? 0,
        lifetimePoints: (user as Electrician).totalPoints ?? 0,
        scanCount: (user as Electrician).totalScans ?? 0,
        unreadNotificationCount,
        recentNotifications: recentNotifications.slice(0, 5),
        tier: this.electricianTier((user as Electrician).totalPoints ?? 0),
        connectedElectricianCount: 0,
        connectedElectricians: [],
        connectedDealer: dealer
          ? {
              id: dealer.id,
              name: dealer.name,
              phone: dealer.phone,
              city: dealer.town,
              state: dealer.state,
              dealerCode: dealer.dealerCode,
            }
          : null,
        bankAccount: this.bankAccountShape(user),
        qrCode: {
          qrValue: qr.qrValue,
          qrImageUrl: qr.qrApiUrl,
          storedQrImageUrl: qr.storedQrImageUrl,
        },
      };
    }

    const connectedElectricians = await this.electricianRepository.find({
      where: { dealerId: user.id },
      order: { joinedDate: 'DESC' },
    });

    const dealerUser = user as unknown as Dealer;
    return {
      id: user.id,
      role: 'DEALER',
      status: user.status,
      fullName: user.name,
      hasPasswordConfigured: Boolean(dealerUser.passwordHash),
      phone: user.phone,
      email: dealerUser.email,
      language: dealerUser.language,
      darkMode: dealerUser.darkMode,
      pushEnabled: dealerUser.pushEnabled,
      address: dealerUser.address,
      state: dealerUser.state,
      city: dealerUser.town,
      pincode: dealerUser.pincode,
      electricianCode: null,
      dealerCode: dealerUser.dealerCode,
      gstNumber: dealerUser.gstNumber,
      gstHolderName: dealerUser.contactPerson ?? null,
      panNumber: dealerUser.panNumber,
      panHolderName: dealerUser.accountHolderName ?? null,
      profileImage: currentImage?.imageData ?? dealerUser.profileImage ?? null,
      pointsBalance: dealerUser.walletBalance ?? 0,
      lifetimePoints: dealerUser.walletBalance ?? 0,
      scanCount: 0,
      unreadNotificationCount,
      recentNotifications: recentNotifications.slice(0, 5),
      tier: this.dealerTier(connectedElectricians.length),
      connectedElectricianCount: connectedElectricians.length,
      connectedElectricians: connectedElectricians.map((electrician) => ({
        id: electrician.id,
        fullName: electrician.name,
        phone: electrician.phone,
        city: electrician.city,
        state: electrician.state,
        electricianCode: electrician.electricianCode,
        status: 'ACTIVE',
        joinedAt: electrician.joinedDate,
      })),
      connectedDealer: null,
      bankAccount: this.bankAccountShape(user),
      qrCode: {
        qrValue: qr.qrValue,
        qrImageUrl: qr.qrApiUrl,
        storedQrImageUrl: qr.storedQrImageUrl,
      },
    };
  }

  async updatePreferences(userId: string, roleInput: string, body: any) {
    const role = this.normalizeRole(roleInput);
    await this.getRepo(role).update(userId, {
      ...(body?.language !== undefined ? { language: body.language } : {}),
      ...(body?.darkMode !== undefined ? { darkMode: Boolean(body.darkMode) } : {}),
      ...(body?.pushEnabled !== undefined ? { pushEnabled: Boolean(body.pushEnabled) } : {}),
    } as any);

    return this.me(userId, role);
  }

  async lookupByCode(rawCode: string) {
    const code = String(rawCode ?? '').trim();
    if (!code) {
      return null;
    }

    let searchValue = code.toUpperCase();
    try {
      const parsed = JSON.parse(code);
      searchValue = String(parsed?.code ?? parsed?.qrCode ?? parsed?.phone ?? code).trim();
    } catch {
      // Keep raw string.
    }

    const electrician = await this.electricianRepository.findOne({
      where: [
        { electricianCode: searchValue },
        { phone: searchValue },
      ],
    });
    if (electrician) {
      const dealer = electrician.dealerId
        ? await this.dealerRepository.findOne({ where: { id: electrician.dealerId } })
        : null;
      const profileImage = await this.userProfileImageRepository.findOne({
        where: { userId: electrician.id, userRole: UserRole.ELECTRICIAN, isCurrent: true },
        order: { createdAt: 'DESC' },
      });
      return {
        id: electrician.id,
        fullName: electrician.name,
        role: 'ELECTRICIAN',
        phone: electrician.phone,
        city: electrician.city,
        state: electrician.state,
        address: electrician.address,
        electricianCode: electrician.electricianCode,
        dealerCode: dealer?.dealerCode ?? null,
        profileImage: profileImage?.imageData ?? electrician.profileImage ?? null,
        connectedDealer: dealer
          ? {
              name: dealer.name,
              phone: dealer.phone,
              dealerCode: dealer.dealerCode,
            }
          : null,
      };
    }

    const dealer = await this.dealerRepository.findOne({
      where: [
        { dealerCode: searchValue },
        { phone: searchValue },
      ],
    });
    if (!dealer) {
      return null;
    }
    const profileImage = await this.userProfileImageRepository.findOne({
      where: { userId: dealer.id, userRole: UserRole.DEALER, isCurrent: true },
      order: { createdAt: 'DESC' },
    });
    return {
      id: dealer.id,
      fullName: dealer.name,
      role: 'DEALER',
      phone: dealer.phone,
      city: dealer.town,
      state: dealer.state,
      address: dealer.address,
      electricianCode: null,
      dealerCode: dealer.dealerCode,
      profileImage: profileImage?.imageData ?? dealer.profileImage ?? null,
      connectedDealer: null,
    };
  }

  async walletSummary(userId: string, roleInput: string) {
    const role = this.normalizeRole(roleInput);
    const user = await this.findUserById(userId, role);
    const transactions = await this.walletRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 15,
    });
    return {
      pointsBalance: user.walletBalance ?? 0,
      lifetimePoints: role === 'electrician' ? ((user as Electrician).totalPoints ?? 0) : (user.walletBalance ?? 0),
      scanCount: role === 'electrician' ? ((user as Electrician).totalScans ?? 0) : 0,
      connectedElectricianCount: role === 'dealer'
        ? await this.electricianRepository.count({ where: { dealerId: userId } })
        : 0,
      bankAccount: this.bankAccountShape(user),
      timeline: transactions,
    };
  }

  async saveBankAccount(userId: string, roleInput: string, body: any) {
    const role = this.normalizeRole(roleInput);
    await this.getRepo(role).update(userId, {
      accountHolderName: body?.accountHolderName,
      bankAccount: body?.accountNumber ?? body?.bankAccount,
      ifsc: body?.ifsc ? String(body.ifsc).trim().toUpperCase() : null,
      bankName: body?.bankName,
      upiId: body?.upiId,
      bankLinked: true,
    } as any);
    const user = await this.findUserById(userId, role);
    return this.bankAccountShape(user);
  }

  async redeem(userId: string, roleInput: string, body: any) {
    const role = this.normalizeRole(roleInput);
    const schemeId = String(body?.schemeId ?? '').trim();
    const scheme = await this.rewardSchemeRepository.findOne({ where: { id: schemeId, active: true } });
    if (!scheme) {
      throw new NotFoundException('Reward scheme not found.');
    }

    const user = await this.findUserById(userId, role);
    if ((user.walletBalance ?? 0) < scheme.pointsCost) {
      throw new BadRequestException('Not enough points to redeem this reward.');
    }

    const redemption = await this.redemptionRepository.save(
      this.redemptionRepository.create({
        userId,
        userName: this.userName(user),
        role: this.toUserRoleEnum(role),
        type: 'reward',
        schemeId: scheme.id,
        note: body?.note || scheme.name,
        points: scheme.pointsCost,
        status: RedemptionStatus.PENDING,
        upiId: user.upiId,
        bankAccount: user.bankAccount,
        ifsc: user.ifsc,
        accountHolderName: user.accountHolderName,
      }),
    );

    await this.adjustUserBalance(userId, role, -scheme.pointsCost);
    const currentBalance = Number(user.walletBalance ?? 0);
    await this.walletRepository.save(
      this.walletRepository.create({
        userId,
        userRole: this.toUserRoleEnum(role),
        type: TransactionType.DEBIT,
        source: TransactionSource.REDEMPTION,
        amount: scheme.pointsCost,
        balanceBefore: currentBalance,
        balanceAfter: currentBalance - scheme.pointsCost,
        description: `${scheme.name} redemption requested`,
        referenceId: redemption.id,
        referenceType: 'redemption',
      }),
    );

    if (role === 'electrician') {
      const electrician = user as Electrician;
      if (electrician.dealerId) {
        await this.creditDealerBonus(electrician.dealerId, electrician.name, scheme.pointsCost);
      }
    }

    await this.createUserNotification(userId, role, {
      title: 'Redemption requested',
      body: `${scheme.name} redemption was submitted successfully.`,
      type: 'Wallet',
    });

    return redemption;
  }

  async transfer(userId: string, roleInput: string, body: any) {
    const role = this.normalizeRole(roleInput);
    const points = Number(body?.points ?? 0);
    const receiverPhone = String(body?.receiverPhone ?? '').trim();
    if (points <= 0) {
      throw new BadRequestException('Points must be greater than zero.');
    }

    const sender = await this.findUserById(userId, role);
    const receiver = await this.findUserByPhone(receiverPhone);
    if (!receiver) {
      throw new NotFoundException('Receiver not found.');
    }
    if (receiver.id === sender.id) {
      throw new BadRequestException('You cannot transfer points to yourself.');
    }
    if ((sender.walletBalance ?? 0) < points) {
      throw new BadRequestException('Insufficient points.');
    }

    await this.adjustUserBalance(userId, role, -points);
    await this.adjustUserBalance(receiver.id, receiver.role, points);

    await this.walletRepository.save([
      this.walletRepository.create({
        userId,
        userRole: this.toUserRoleEnum(role),
        type: TransactionType.DEBIT,
        source: TransactionSource.TRANSFER,
        amount: points,
        balanceBefore: Number(sender.walletBalance ?? 0),
        balanceAfter: Number(sender.walletBalance ?? 0) - points,
        description: `Transferred to ${receiver.phone}`,
        referenceType: 'transfer',
      }),
      this.walletRepository.create({
        userId: receiver.id,
        userRole: this.toUserRoleEnum(receiver.role),
        type: TransactionType.CREDIT,
        source: TransactionSource.TRANSFER,
        amount: points,
        balanceBefore: Number(receiver.walletBalance ?? 0),
        balanceAfter: Number(receiver.walletBalance ?? 0) + points,
        description: `Received from ${sender.phone}`,
        referenceType: 'transfer',
      }),
    ]);

    return {
      transferred: points,
      receiver: {
        id: receiver.id,
        phone: receiver.phone,
        name: this.userName(receiver),
      },
    };
  }

  async redemptions(userId: string) {
    return this.redemptionRepository.find({
      where: { userId },
      order: { requestedAt: 'DESC' },
    });
  }

  async dealerBonus(userId: string) {
    const events = await this.walletRepository.find({
      where: { userId, source: TransactionSource.COMMISSION },
      order: { createdAt: 'DESC' },
    });
    const availableBonus = events.reduce((sum, item) => {
      return sum + (item.type === TransactionType.CREDIT ? Number(item.amount) : -Number(item.amount));
    }, 0);

    return {
      availableBonus,
      commissionRate: 0.05,
      events,
    };
  }

  async requestDealerBonusWithdrawal(userId: string, body: any) {
    const amount = Number(body?.amount ?? 0);
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero.');
    }

    const bonus = await this.dealerBonus(userId);
    if (bonus.availableBonus < amount) {
      throw new BadRequestException('Not enough dealer bonus available for withdrawal.');
    }

    const dealer = await this.dealerRepository.findOne({ where: { id: userId } });
    const tx = await this.walletRepository.save(
      this.walletRepository.create({
        userId,
        userRole: UserRole.DEALER,
        type: TransactionType.DEBIT,
        source: TransactionSource.COMMISSION,
        amount,
        balanceBefore: bonus.availableBonus,
        balanceAfter: bonus.availableBonus - amount,
        description: `Dealer bonus withdrawal requested for Rs ${amount}`,
        referenceType: 'dealer_bonus_withdrawal',
      }),
    );

    await this.redemptionRepository.save(
      this.redemptionRepository.create({
        userId,
        userName: dealer?.name ?? 'Dealer',
        role: UserRole.DEALER,
        type: 'dealer_bonus_withdrawal',
        amount,
        points: amount,
        note: `Dealer bonus withdrawal requested for Rs ${amount}`,
        status: RedemptionStatus.PENDING,
        upiId: dealer?.upiId,
        bankAccount: dealer?.bankAccount,
        ifsc: dealer?.ifsc,
        accountHolderName: dealer?.accountHolderName,
      }),
    );

    await this.createUserNotification(userId, 'dealer', {
      title: 'Dealer bonus withdrawal requested',
      body: `Rs ${amount} dealer bonus withdrawal request has been submitted.`,
      type: 'Wallet',
    });

    return tx;
  }

  private async assertOtp(phone: string, otp: string, purpose: string, consume: boolean) {
    const record = await this.otpCodeRepository.findOne({
      where: { phone, purpose },
      order: { createdAt: 'DESC' },
    });
    if (!record) {
      throw new BadRequestException('Please verify your mobile number first.');
    }
    if (record.expiresAt.getTime() < Date.now()) {
      await this.otpCodeRepository.delete({ id: record.id });
      throw new BadRequestException('OTP has expired. Please resend OTP.');
    }
    if (record.code !== otp) {
      throw new BadRequestException('Enter the 4-digit OTP to verify your number.');
    }
    if (consume) {
      await this.otpCodeRepository.delete({ id: record.id });
    } else if (!record.verified) {
      await this.otpCodeRepository.update(record.id, { verified: true });
    }
  }

  private async sessionFromUser(user: any, role: 'electrician' | 'dealer') {
    const payload = { sub: user.id, phone: user.phone, role };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '30d',
      }),
      user: await this.me(user.id, role),
    };
  }

  private normalizeRole(role: string | undefined): 'electrician' | 'dealer' {
    const value = String(role ?? '').trim().toLowerCase();
    if (value === 'electrician') return 'electrician';
    if (value === 'dealer') return 'dealer';
    throw new BadRequestException('Invalid role.');
  }

  private toUserRoleEnum(role: 'electrician' | 'dealer') {
    return role === 'electrician' ? UserRole.ELECTRICIAN : UserRole.DEALER;
  }

  private getRepo(role: 'electrician' | 'dealer') {
    return role === 'electrician' ? this.electricianRepository : this.dealerRepository;
  }

  private async findActiveUserByPhone(
    phone: string,
    role: 'electrician' | 'dealer',
    includePassword = false,
    throwPending = false,
  ) {
    const qb = this.getRepo(role)
      .createQueryBuilder('user')
      .where('user.phone = :phone', { phone });
    if (includePassword) {
      qb.addSelect('user.passwordHash');
    }
    const user = await qb.getOne();
    if (!user) {
      throw new UnauthorizedException('Invalid account.');
    }
    if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('Invalid account.');
    }
    if (throwPending && user.status === UserStatus.PENDING) {
      throw new UnauthorizedException('Waiting for approve. Your account is pending admin approval.');
    }
    return user;
  }

  private async findUserById(id: string, role: 'electrician' | 'dealer', includePassword = false): Promise<Electrician | Dealer> {
    const repo = this.getRepo(role);
    const qb = repo
      .createQueryBuilder('user')
      .where('user.id = :id', { id });
    if (includePassword) {
      qb.addSelect('user.passwordHash');
    }
    const user = await qb.getOne();
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user as Electrician | Dealer;
  }

  private async findAnyUserById(id: string) {
    return (await this.electricianRepository.findOne({ where: { id } }))
      || (await this.dealerRepository.findOne({ where: { id } }));
  }

  private async findUserByPhone(phone: string) {
    const electrician = await this.electricianRepository.findOne({ where: { phone } });
    if (electrician) {
      return { ...electrician, role: 'electrician' as const };
    }
    const dealer = await this.dealerRepository.findOne({ where: { phone } });
    if (dealer) {
      return { ...dealer, role: 'dealer' as const };
    }
    return null;
  }

  private userName(user: any) {
    return user.name || user.fullName || 'User';
  }

  private async adjustUserBalance(userId: string, role: 'electrician' | 'dealer', delta: number) {
    if (role === 'electrician') {
      const user = await this.electricianRepository.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found.');
      const nextBalance = Math.max(0, Number(user.walletBalance ?? 0) + delta);
      const nextPoints = Math.max(0, Number(user.totalPoints ?? 0) + delta);
      await this.electricianRepository.update(userId, {
        walletBalance: nextBalance,
        totalPoints: nextPoints,
        tier: this.memberTier(nextPoints),
      });
      return;
    }

    const user = await this.dealerRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    const nextBalance = Math.max(0, Number(user.walletBalance ?? 0) + delta);
    await this.dealerRepository.update(userId, { walletBalance: nextBalance });
  }

  private async creditDealerBonus(dealerId: string, electricianName: string, redeemedPoints: number) {
    const dealer = await this.dealerRepository.findOne({ where: { id: dealerId } });
    if (!dealer) {
      return;
    }
    const bonus = Math.floor(redeemedPoints * 0.05);
    if (bonus <= 0) {
      return;
    }
    await this.dealerRepository.update(dealerId, {
      walletBalance: Number(dealer.walletBalance ?? 0) + bonus,
    });
    await this.walletRepository.save(
      this.walletRepository.create({
        userId: dealerId,
        userRole: UserRole.DEALER,
        type: TransactionType.CREDIT,
        source: TransactionSource.COMMISSION,
        amount: bonus,
        balanceBefore: Number(dealer.walletBalance ?? 0),
        balanceAfter: Number(dealer.walletBalance ?? 0) + bonus,
        description: `5% bonus from ${electricianName} redemption`,
        referenceType: 'dealer_bonus',
      }),
    );
  }

  private async createUserNotification(
    userId: string,
    role: string,
    payload: { title: string; body: string; type?: string },
  ) {
    return this.notificationRepository.save(
      this.notificationRepository.create({
        userId,
        title: payload.title,
        message: payload.body,
        body: payload.body,
        type: payload.type,
        targetRole: role,
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      }),
    );
  }

  private bankAccountShape(user: any) {
    if (!user.bankLinked && !user.bankAccount && !user.upiId) {
      return null;
    }
    return {
      accountHolderName: user.accountHolderName ?? null,
      accountNumber: user.bankAccount ?? null,
      bankAccount: user.bankAccount ?? null,
      ifsc: user.ifsc ?? null,
      bankName: user.bankName ?? null,
      upiId: user.upiId ?? null,
      bankLinked: Boolean(user.bankLinked),
    };
  }

  private toPublicProduct(product: Product, categoryId?: string, category?: ProductCategory) {
    const description = product.description?.trim() || product.sub?.trim() || product.name;
    return {
      id: product.id,
      name: product.name,
      description,
      imageUrl: product.image,
      gallery: product.image ? [product.image] : [],
      descriptionMeta: {
        tone: 'professional',
        layout: 'single-column',
        emphasis: 'readability',
      },
      variants: null,
      price: product.price !== null && product.price !== undefined ? Number(product.price) : null,
      points: product.points ?? 0,
      badge: product.badge ?? null,
      active: product.isActive,
      categoryId: categoryId || category?.id || product.category,
      category: category
        ? {
            id: category.id,
            categoryId: category.id,
            label: category.label,
            glyph: category.glyph,
            imageUrl: category.imageUrl,
          }
        : null,
    };
  }

  private buildQrImageUrl(value: string) {
    const baseUrl = String(this.configService.get('QR_IMAGE_BASE_URL') || '').trim();
    if (!baseUrl) {
      return null;
    }
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}text=${encodeURIComponent(value)}`;
  }

  private extractQrCode(rawPayload: string) {
    try {
      const parsed = JSON.parse(rawPayload);
      return String(parsed?.code ?? parsed?.qrCode ?? parsed?.token ?? parsed?.value ?? rawPayload).trim();
    } catch {
      return rawPayload.trim();
    }
  }

  private async nextElectricianCode(state?: string) {
    const prefix = String(state || 'SRV').slice(0, 2).toUpperCase();
    const count = await this.electricianRepository.count();
    for (let offset = 0; offset < 1000; offset += 1) {
      const sequence = count + offset;
      const candidate = `${prefix}${String(3900 + sequence).padStart(5, '0')}-${String(sequence + 1).padStart(3, '0')}`;
      const existing = await this.electricianRepository.findOne({ where: { electricianCode: candidate } });
      if (!existing) {
        return candidate;
      }
    }
    throw new ConflictException('Unable to generate a unique electrician code right now.');
  }

  private async nextDealerCode(state?: string) {
    const prefix = String(state || 'SRV').slice(0, 2).toUpperCase();
    const count = await this.dealerRepository.count();
    for (let offset = 0; offset < 1000; offset += 1) {
      const sequence = count + offset;
      const candidate = `${prefix}-05-${String(800206 + sequence).padStart(6, '0')}-${String(sequence + 1).padStart(3, '0')}`;
      const existing = await this.dealerRepository.findOne({ where: { dealerCode: candidate } });
      if (!existing) {
        return candidate;
      }
    }
    throw new ConflictException('Unable to generate a unique dealer code right now.');
  }

  private memberTier(points: number): MemberTier {
    if (points >= 10001) return MemberTier.DIAMOND;
    if (points >= 5001) return MemberTier.PLATINUM;
    if (points >= 1001) return MemberTier.GOLD;
    return MemberTier.SILVER;
  }

  private electricianTier(points: number) {
    if (points <= 1000) return { name: 'Silver', nextAt: 1001 };
    if (points <= 5000) return { name: 'Gold', nextAt: 5001 };
    if (points <= 10000) return { name: 'Platinum', nextAt: 10001 };
    return { name: 'Diamond', nextAt: null };
  }

  private dealerTier(count: number) {
    if (count <= 100) return { name: 'Silver', nextAt: 101 };
    if (count <= 300) return { name: 'Gold', nextAt: 301 };
    if (count <= 500) return { name: 'Platinum', nextAt: 501 };
    return { name: 'Diamond', nextAt: null };
  }

  private getInitials(name?: string) {
    return String(name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  private dateKey(date: Date, timeZone: string) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  private normalizeTimezone(timezone?: string) {
    if (!timezone) return 'Asia/Kolkata';
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date());
      return timezone;
    } catch {
      return 'Asia/Kolkata';
    }
  }

  private festivalDateKey(date: Date) {
    return new Date(date).toISOString().slice(0, 10);
  }

  private defaultFestivalTheme(timezone: string, currentDate: string) {
    return {
      active: false,
      source: 'default',
      timezone,
      currentDate,
      serverTime: new Date().toISOString(),
      id: null,
      name: null,
      slug: null,
      greeting: null,
      subGreeting: null,
      emoji: '🎉',
      bannerEmojis: '🎉✨🎊',
      particleEmojis: '✨⭐🌟',
      theme: {
        primaryColor: '#DE3B30',
        secondaryColor: '#F59E0B',
        accentColor: '#FFFFFF',
        bgColor: '#FFF8E7',
        cardColor: '#FFFBF0',
        textColor: '#1C0A00',
      },
      startDate: null,
      endDate: null,
    };
  }
}
