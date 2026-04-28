import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Electrician } from '../../database/entities/electrician.entity';
import { Dealer } from '../../database/entities/dealer.entity';
import { OtpCode } from '../../database/entities/otp-code.entity';
import { MemberTier, UserStatus } from '../../common/enums';
import {
  MobileLoginDto,
  VerifyOtpDto,
  MobilePasswordLoginDto,
  SendSignupOtpDto,
  VerifySignupOtpDto,
  RegisterDealerDto,
  RegisterElectricianDto,
} from './dto/mobile-login.dto';

@Injectable()
export class MobileAuthService {
  constructor(
    @InjectRepository(Electrician)
    private electricianRepository: Repository<Electrician>,
    @InjectRepository(Dealer)
    private dealerRepository: Repository<Dealer>,
    @InjectRepository(OtpCode)
    private otpCodeRepository: Repository<OtpCode>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private generateOtp(): string {
    return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
  }

  private async createOtp(phone: string, purpose: string) {
    const otp = this.generateOtp();
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

    return otp;
  }

  private async verifyOtpCode(phone: string, purpose: string, otp: string) {
    const stored = await this.otpCodeRepository.findOne({
      where: { phone, purpose, verified: false },
      order: { createdAt: 'DESC' },
    });

    if (!stored) {
      throw new BadRequestException('OTP not found or expired. Please request a new OTP.');
    }

    if (Date.now() > new Date(stored.expiresAt).getTime()) {
      await this.otpCodeRepository.delete({ id: stored.id });
      throw new BadRequestException('OTP expired. Please request a new OTP.');
    }

    if (stored.code !== otp) {
      throw new UnauthorizedException('Invalid OTP.');
    }

    await this.otpCodeRepository.update(stored.id, { verified: true });
    return stored;
  }

  private async ensureVerifiedSignupOtp(phone: string, role: 'electrician' | 'dealer') {
    const purpose = `MOBILE_${role.toUpperCase()}_SIGNUP`;
    const verifiedOtp = await this.otpCodeRepository.findOne({
      where: { phone, purpose, verified: true },
      order: { createdAt: 'DESC' },
    });

    if (!verifiedOtp) {
      throw new BadRequestException('Please verify OTP before creating your account.');
    }

    if (Date.now() > new Date(verifiedOtp.expiresAt).getTime()) {
      await this.otpCodeRepository.delete({ id: verifiedOtp.id });
      throw new BadRequestException('Verified OTP expired. Please request a new OTP.');
    }

    return verifiedOtp;
  }

  private async buildAuthResponse(user: any, role: 'electrician' | 'dealer') {
    const payload = { sub: user.id, phone: user.phone, role };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: '30d',
    });

    return {
      accessToken,
      refreshToken,
      user: this.formatUserProfile(user, role),
    };
  }

  private buildCode(prefix: string) {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${Date.now().toString().slice(-5)}${random}`;
  }

  async sendOtp(dto: MobileLoginDto) {
    const { phone, role } = dto;

    // Check if user exists
    if (role === 'electrician') {
      const electrician = await this.electricianRepository.findOne({ where: { phone } });
      if (!electrician) {
        throw new NotFoundException('Electrician not registered. Please contact your dealer.');
      }
      if (electrician.status === 'suspended') {
        throw new UnauthorizedException('Account is suspended. Contact support.');
      }
    } else {
      const dealer = await this.dealerRepository.findOne({ where: { phone } });
      if (!dealer) {
        throw new NotFoundException('Dealer not registered. Please contact SRV admin.');
      }
      if (dealer.status === 'suspended') {
        throw new UnauthorizedException('Account is suspended. Contact support.');
      }
    }

    const purpose = `MOBILE_${role.toUpperCase()}_LOGIN`;
    const otp = await this.createOtp(phone, purpose);

    console.log(`[OTP] Phone: ${phone}, Role: ${role}, OTP: ${otp}`);

    return {
      success: true,
      message: 'OTP sent successfully',
      expiresInSeconds: 300,
      devOtp: otp, // Show in dev mode — remove in production
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { phone, role, otp } = dto;
    const purpose = `MOBILE_${role.toUpperCase()}_LOGIN`;
    await this.verifyOtpCode(phone, purpose, otp);

    // Get user profile
    let user: any;
    if (role === 'electrician') {
      user = await this.electricianRepository.findOne({
        where: { phone },
        relations: ['dealer'],
      });
    } else {
      user = await this.dealerRepository.findOne({
        where: { phone },
        relations: ['electricians'],
      });
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update last activity
    if (role === 'electrician') {
      await this.electricianRepository.update(user.id, { lastActivityAt: new Date() });
    } else {
      await this.dealerRepository.update(user.id, { lastActivityAt: new Date() });
    }

    return this.buildAuthResponse(user, role);
  }

  async passwordLogin(dto: MobilePasswordLoginDto) {
    const { phone, role, password } = dto;
    const bcrypt = await import('bcrypt');

    const user =
      role === 'electrician'
        ? await this.electricianRepository.findOne({
            where: { phone },
            select: ['id', 'phone', 'name', 'passwordHash', 'status'],
            relations: ['dealer'],
          })
        : await this.dealerRepository.findOne({
            where: { phone },
            select: ['id', 'phone', 'name', 'passwordHash', 'status'],
          });

    if (!user) {
      throw new UnauthorizedException('Invalid phone number or password.');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account is suspended. Contact support.');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Password login is not configured for this account.');
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Invalid phone number or password.');
    }

    if (role === 'electrician') {
      await this.electricianRepository.update(user.id, { lastActivityAt: new Date() });
      const fullUser = await this.electricianRepository.findOne({
        where: { id: user.id },
        relations: ['dealer'],
      });
      if (!fullUser) throw new NotFoundException('User not found');
      return this.buildAuthResponse(fullUser, role);
    }

    await this.dealerRepository.update(user.id, { lastActivityAt: new Date() });
    const fullUser = await this.dealerRepository.findOne({ where: { id: user.id } });
    if (!fullUser) throw new NotFoundException('User not found');
    return this.buildAuthResponse(fullUser, role);
  }

  async sendSignupOtp(dto: SendSignupOtpDto) {
    const { phone, role } = dto;

    const existing =
      role === 'electrician'
        ? await this.electricianRepository.findOne({ where: { phone } })
        : await this.dealerRepository.findOne({ where: { phone } });

    if (existing) {
      throw new ConflictException(`${role === 'electrician' ? 'Electrician' : 'Dealer'} already registered.`);
    }

    const purpose = `MOBILE_${role.toUpperCase()}_SIGNUP`;
    const otp = await this.createOtp(phone, purpose);
    console.log(`[OTP] Signup Phone: ${phone}, Role: ${role}, OTP: ${otp}`);

    return {
      success: true,
      message: 'Signup OTP sent successfully',
      expiresInSeconds: 300,
      devOtp: otp,
    };
  }

  async verifySignupOtp(dto: VerifySignupOtpDto) {
    const { phone, role, otp } = dto;
    const purpose = `MOBILE_${role.toUpperCase()}_SIGNUP`;
    await this.verifyOtpCode(phone, purpose, otp);

    return {
      success: true,
      message: 'OTP verified successfully',
    };
  }

  async registerDealer(dto: RegisterDealerDto) {
    await this.ensureVerifiedSignupOtp(dto.phone, 'dealer');

    const existingDealer = await this.dealerRepository.findOne({
      where: [{ phone: dto.phone }, ...(dto.email ? [{ email: dto.email }] : [])],
    });
    if (existingDealer) {
      throw new ConflictException('Dealer already registered with this phone or email.');
    }

    const bcrypt = await import('bcrypt');
    const statePrefix = (dto.state || 'SR').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 2) || 'SR';
    const dealer = this.dealerRepository.create({
      name: dto.name.trim(),
      phone: dto.phone,
      dealerCode: this.buildCode(statePrefix),
      email: dto.email?.trim() || null,
      town: dto.town.trim(),
      district: dto.district.trim(),
      state: dto.state.trim(),
      address: dto.address.trim(),
      pincode: dto.pincode?.trim() || null,
      gstNumber: dto.gstNumber?.trim() || null,
      status: UserStatus.PENDING,
      tier: MemberTier.SILVER,
      electricianCount: 0,
      passwordHash: dto.password ? await bcrypt.hash(dto.password, 10) : null,
    });

    const saved = await this.dealerRepository.save(dealer);
    return this.buildAuthResponse(saved, 'dealer');
  }

  async registerElectrician(dto: RegisterElectricianDto) {
    await this.ensureVerifiedSignupOtp(dto.phone, 'electrician');

    const existingElectrician = await this.electricianRepository.findOne({
      where: [{ phone: dto.phone }, ...(dto.email ? [{ email: dto.email }] : [])],
    });
    if (existingElectrician) {
      throw new ConflictException('Electrician already registered with this phone or email.');
    }

    const dealer = await this.dealerRepository.findOne({ where: { phone: dto.dealerPhone } });
    if (!dealer) {
      throw new NotFoundException('Dealer not found with this phone number.');
    }

    const bcrypt = await import('bcrypt');
    const statePrefix = (dto.state || dealer.state || 'SR')
      .replace(/[^A-Za-z]/g, '')
      .toUpperCase()
      .slice(0, 2) || 'SR';

    const electrician = this.electricianRepository.create({
      name: dto.name.trim(),
      phone: dto.phone,
      electricianCode: this.buildCode(statePrefix),
      email: dto.email?.trim() || null,
      city: dto.city.trim(),
      district: dto.district.trim(),
      state: dto.state.trim(),
      pincode: dto.pincode?.trim() || null,
      address: dto.address?.trim() || null,
      dealerId: dealer.id,
      status: UserStatus.PENDING,
      tier: MemberTier.SILVER,
      subCategory: dto.subCategory as any,
      passwordHash: dto.password ? await bcrypt.hash(dto.password, 10) : null,
    });

    const saved = await this.electricianRepository.save(electrician);
    await this.dealerRepository.update(dealer.id, {
      electricianCount: (dealer.electricianCount ?? 0) + 1,
    });

    const fullUser = await this.electricianRepository.findOne({
      where: { id: saved.id },
      relations: ['dealer'],
    });
    if (!fullUser) throw new NotFoundException('User not found');
    return this.buildAuthResponse(fullUser, 'electrician');
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      let user: any;
      if (payload.role === 'electrician') {
        user = await this.electricianRepository.findOne({ where: { id: payload.sub } });
      } else {
        user = await this.dealerRepository.findOne({ where: { id: payload.sub } });
      }

      if (!user) throw new UnauthorizedException('User not found');

      const newPayload = { sub: user.id, phone: user.phone, role: payload.role };
      const accessToken = this.jwtService.sign(newPayload);

      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: string, role: string) {
    let user: any;
    if (role === 'electrician') {
      user = await this.electricianRepository.findOne({
        where: { id: userId },
        relations: ['dealer'],
      });
    } else {
      user = await this.dealerRepository.findOne({
        where: { id: userId },
      });
    }

    if (!user) throw new NotFoundException('User not found');
    return this.formatUserProfile(user, role);
  }

  async updateProfile(userId: string, role: string, data: any) {
    if (role === 'electrician') {
      await this.electricianRepository.update(userId, {
        name: data.name,
        email: data.email,
        city: data.city,
        state: data.state,
        district: data.district,
        pincode: data.pincode,
        address: data.address,
        language: data.language,
        darkMode: data.darkMode,
        pushEnabled: data.pushEnabled,
        upiId: data.upiId,
        bankAccount: data.bankAccount,
        ifsc: data.ifsc,
        bankName: data.bankName,
        accountHolderName: data.accountHolderName,
        ...(data.profileImage !== undefined && { profileImage: data.profileImage }),
        ...(data.bankLinked !== undefined && { bankLinked: data.bankLinked }),
      });
      return this.getProfile(userId, role);
    } else {
      await this.dealerRepository.update(userId, {
        name: data.name,
        email: data.email,
        town: data.town,
        district: data.district,
        state: data.state,
        address: data.address,
        pincode: data.pincode,
        language: data.language,
        darkMode: data.darkMode,
        pushEnabled: data.pushEnabled,
        gstNumber: data.gstNumber,
        upiId: data.upiId,
        bankAccount: data.bankAccount,
        ifsc: data.ifsc,
        bankName: data.bankName,
        accountHolderName: data.accountHolderName,
        ...(data.profileImage !== undefined && { profileImage: data.profileImage }),
        ...(data.bankLinked !== undefined && { bankLinked: data.bankLinked }),
      });
      return this.getProfile(userId, role);
    }
  }

  async logout(userId: string, role: string) {
    if (role === 'electrician') {
      await this.electricianRepository.update(userId, { lastActivityAt: new Date() });
    } else {
      await this.dealerRepository.update(userId, { lastActivityAt: new Date() });
    }
    return { success: true, message: 'Logged out successfully' };
  }

  private formatUserProfile(user: any, role: string) {
    if (role === 'electrician') {
      return {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        electricianCode: user.electricianCode,
        city: user.city,
        state: user.state,
        district: user.district,
        pincode: user.pincode,
        address: user.address,
        language: user.language,
        darkMode: user.darkMode,
        pushEnabled: user.pushEnabled,
        tier: user.tier,
        subCategory: user.subCategory,
        totalPoints: user.totalPoints,
        totalScans: user.totalScans,
        walletBalance: user.walletBalance,
        totalRedemptions: user.totalRedemptions,
        status: user.status,
        kycStatus: user.kycStatus,
        bankLinked: user.bankLinked,
        upiId: user.upiId,
        bankAccount: user.bankAccount,
        ifsc: user.ifsc,
        bankName: user.bankName,
        accountHolderName: user.accountHolderName,
        profileImage: user.profileImage ?? null,
        dealerId: user.dealerId,
        dealerName: user.dealer?.name ?? null,
        dealerPhone: user.dealer?.phone ?? null,
        dealerTown: user.dealer?.town ?? null,
        dealerCode: user.dealer?.dealerCode ?? null,
        role: 'electrician',
      };
    } else {
      return {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        dealerCode: user.dealerCode,
        town: user.town,
        district: user.district,
        state: user.state,
        address: user.address,
        language: user.language,
        darkMode: user.darkMode,
        pushEnabled: user.pushEnabled,
        pincode: user.pincode,
        gstNumber: user.gstNumber,
        tier: user.tier,
        electricianCount: user.electricianCount,
        walletBalance: user.walletBalance,
        status: user.status,
        kycStatus: user.kycStatus,
        bankLinked: user.bankLinked,
        upiId: user.upiId,
        bankAccount: user.bankAccount,
        ifsc: user.ifsc,
        bankName: user.bankName,
        accountHolderName: user.accountHolderName,
        profileImage: user.profileImage ?? null,
        role: 'dealer',
      };
    }
  }
}
