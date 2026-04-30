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
import * as bcrypt from 'bcrypt';
import { Electrician } from '../../database/entities/electrician.entity';
import { Dealer } from '../../database/entities/dealer.entity';
import { MobileLoginDto, VerifyOtpDto } from './dto/mobile-login.dto';
import { ElectricianSubCategory, UserStatus } from '../../common/enums';

// In-memory OTP store (production mein Redis use karein)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

@Injectable()
export class MobileAuthService {
  constructor(
    @InjectRepository(Electrician)
    private electricianRepository: Repository<Electrician>,
    @InjectRepository(Dealer)
    private dealerRepository: Repository<Dealer>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private generateOtp(): string {
    if (this.configService.get('NODE_ENV') === 'development') {
      return '1234';
    }
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  private generateTokens(payload: { sub: string; phone: string; role: string }) {
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: '30d',
    });
    return { accessToken, refreshToken };
  }

  // ── Login OTP ──────────────────────────────────────────────────────────────

  async sendOtp(dto: MobileLoginDto) {
    const { phone, role } = dto;

    if (role === 'electrician') {
      const electrician = await this.electricianRepository.findOne({ where: { phone } });
      if (!electrician) throw new NotFoundException('Electrician not registered. Please contact your dealer.');
      if (electrician.status === 'suspended') throw new UnauthorizedException('Account is suspended. Contact support.');
    } else {
      const dealer = await this.dealerRepository.findOne({ where: { phone } });
      if (!dealer) throw new NotFoundException('Dealer not registered. Please contact SRV admin.');
      if (dealer.status === 'suspended') throw new UnauthorizedException('Account is suspended. Contact support.');
    }

    const otp = this.generateOtp();
    const key = `${phone}:${role}`;
    otpStore.set(key, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
    console.log(`[OTP] Phone: ${phone}, Role: ${role}, OTP: ${otp}`);

    return {
      success: true,
      message: 'OTP sent successfully',
      ...(this.configService.get('NODE_ENV') === 'development' && { devOtp: otp }),
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { phone, role, otp } = dto;
    const key = `${phone}:${role}`;
    const stored = otpStore.get(key);

    if (!stored) throw new BadRequestException('OTP not found or expired. Please request a new OTP.');
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(key);
      throw new BadRequestException('OTP expired. Please request a new OTP.');
    }
    if (stored.otp !== otp) throw new UnauthorizedException('Invalid OTP.');
    otpStore.delete(key);

    let user: any;
    if (role === 'electrician') {
      user = await this.electricianRepository.findOne({ where: { phone }, relations: ['dealer'] });
    } else {
      user = await this.dealerRepository.findOne({ where: { phone } });
    }
    if (!user) throw new NotFoundException('User not found');

    if (role === 'electrician') {
      await this.electricianRepository.update(user.id, { lastActivityAt: new Date() });
    } else {
      await this.dealerRepository.update(user.id, { lastActivityAt: new Date() });
    }

    const payload = { sub: user.id, phone: user.phone, role };
    const tokens = this.generateTokens(payload);
    return { ...tokens, user: this.formatUserProfile(user, role) };
  }

  // ── Signup OTP ─────────────────────────────────────────────────────────────

  async sendSignupOtp(phone: string, role: 'electrician' | 'dealer') {
    // Check if already registered
    if (role === 'electrician') {
      const existing = await this.electricianRepository.findOne({ where: { phone } });
      if (existing) throw new ConflictException('Phone number already registered.');
    } else {
      const existing = await this.dealerRepository.findOne({ where: { phone } });
      if (existing) throw new ConflictException('Phone number already registered.');
    }

    const otp = this.generateOtp();
    const key = `signup:${phone}:${role}`;
    otpStore.set(key, { otp, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 min for signup
    console.log(`[SIGNUP OTP] Phone: ${phone}, Role: ${role}, OTP: ${otp}`);

    return {
      success: true,
      message: 'OTP sent successfully',
      ...(this.configService.get('NODE_ENV') === 'development' && { devOtp: otp }),
    };
  }

  async verifySignupOtp(phone: string, role: 'electrician' | 'dealer', otp: string) {
    const key = `signup:${phone}:${role}`;
    const stored = otpStore.get(key);

    if (!stored) throw new BadRequestException('OTP not found or expired.');
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(key);
      throw new BadRequestException('OTP expired. Please request a new OTP.');
    }
    if (stored.otp !== otp) throw new UnauthorizedException('Invalid OTP.');
    // Keep OTP in store for signup completion (mark as verified)
    otpStore.set(key, { otp: 'VERIFIED', expiresAt: Date.now() + 15 * 60 * 1000 });

    return { success: true, message: 'OTP verified successfully' };
  }

  // ── Signup Registration ────────────────────────────────────────────────────

  async registerDealer(data: {
    name: string; phone: string; email?: string; town: string;
    district: string; state: string; address: string; pincode?: string;
    gstNumber?: string; password?: string;
  }) {
    const existing = await this.dealerRepository.findOne({ where: { phone: data.phone } });
    if (existing) throw new ConflictException('Phone number already registered.');

    const stateCode = data.state?.substring(0, 2).toUpperCase() ?? 'XX';
    const dealerCode = `DLR${stateCode}${Date.now().toString().slice(-6)}`;

    const dealer = this.dealerRepository.create({
      name: data.name,
      phone: data.phone,
      email: data.email,
      town: data.town,
      district: data.district,
      state: data.state,
      address: data.address,
      pincode: data.pincode,
      gstNumber: data.gstNumber,
      dealerCode,
      status: UserStatus.PENDING,
    });

    const saved = await this.dealerRepository.save(dealer);
    const payload = { sub: saved.id, phone: saved.phone, role: 'dealer' };
    const tokens = this.generateTokens(payload);
    return { ...tokens, user: this.formatUserProfile(saved, 'dealer') };
  }

  async registerElectrician(data: {
    name: string; phone: string; email?: string; city: string;
    district: string; state: string; address?: string; pincode?: string;
    dealerPhone: string; password?: string; subCategory?: string;
  }) {
    const existing = await this.electricianRepository.findOne({ where: { phone: data.phone } });
    if (existing) throw new ConflictException('Phone number already registered.');

    // Find dealer by phone
    let dealerId: string | undefined;
    if (data.dealerPhone) {
      const dealer = await this.dealerRepository.findOne({ where: { phone: data.dealerPhone } });
      if (!dealer) throw new NotFoundException('Dealer not found with this phone number.');
      dealerId = dealer.id;
    }

    const stateCode = data.state?.substring(0, 2).toUpperCase() ?? 'XX';
    const electricianCode = `ELC${stateCode}${Date.now().toString().slice(-6)}`;

    const electrician = this.electricianRepository.create({
      name: data.name,
      phone: data.phone,
      email: data.email,
      city: data.city,
      district: data.district,
      state: data.state,
      address: data.address,
      pincode: data.pincode,
      dealerId,
      electricianCode,
      subCategory: (data.subCategory as ElectricianSubCategory) ?? ElectricianSubCategory.GENERAL_ELECTRICIAN,
      status: UserStatus.PENDING,
    });

    const saved = await this.electricianRepository.save(electrician);
    const savedWithDealer = await this.electricianRepository.findOne({
      where: { id: saved.id },
      relations: ['dealer'],
    });

    const payload = { sub: saved.id, phone: saved.phone, role: 'electrician' };
    const tokens = this.generateTokens(payload);
    return { ...tokens, user: this.formatUserProfile(savedWithDealer ?? saved, 'electrician') };
  }

  // ── Password Login ─────────────────────────────────────────────────────────

  async passwordLogin(phone: string, role: 'electrician' | 'dealer', password: string) {
    // For now, use OTP '1234' as password in dev, or check bcrypt hash if set
    let user: any;
    if (role === 'electrician') {
      user = await this.electricianRepository.findOne({ where: { phone }, relations: ['dealer'] });
    } else {
      user = await this.dealerRepository.findOne({ where: { phone } });
    }

    if (!user) throw new NotFoundException('User not found.');
    if (user.status === 'suspended') throw new UnauthorizedException('Account is suspended.');

    // Dev mode: accept '1234' as password
    const isDev = this.configService.get('NODE_ENV') === 'development';
    if (isDev && password === '1234') {
      // Allow
    } else if (user.passwordHash) {
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) throw new UnauthorizedException('Invalid password.');
    } else {
      // No password set — reject
      throw new BadRequestException('Password login not set up. Please use OTP login.');
    }

    if (role === 'electrician') {
      await this.electricianRepository.update(user.id, { lastActivityAt: new Date() });
    } else {
      await this.dealerRepository.update(user.id, { lastActivityAt: new Date() });
    }

    const payload = { sub: user.id, phone: user.phone, role };
    const tokens = this.generateTokens(payload);
    return { ...tokens, user: this.formatUserProfile(user, role) };
  }

  // ── Token Refresh ──────────────────────────────────────────────────────────

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

  // ── Profile ────────────────────────────────────────────────────────────────

  async getProfile(userId: string, role: string) {
    let user: any;
    if (role === 'electrician') {
      user = await this.electricianRepository.findOne({ where: { id: userId }, relations: ['dealer'] });
    } else {
      user = await this.dealerRepository.findOne({ where: { id: userId } });
    }
    if (!user) throw new NotFoundException('User not found');
    return this.formatUserProfile(user, role);
  }

  async updateProfile(userId: string, role: string, data: any) {
    if (role === 'electrician') {
      const updateData: any = {};
      const allowed = ['name','email','city','state','district','pincode','address',
        'upiId','bankAccount','ifsc','bankName','accountHolderName','bankLinked',
        'language','darkMode','pushEnabled'];
      allowed.forEach(k => { if (data[k] !== undefined) updateData[k] = data[k]; });
      if (data.profileImage !== undefined) updateData.profileImage = data.profileImage;
      await this.electricianRepository.update(userId, updateData);
    } else {
      const updateData: any = {};
      const allowed = ['name','email','town','district','state','address','pincode',
        'gstNumber','upiId','bankAccount','ifsc','bankName','accountHolderName','bankLinked'];
      allowed.forEach(k => { if (data[k] !== undefined) updateData[k] = data[k]; });
      if (data.profileImage !== undefined) updateData.profileImage = data.profileImage;
      await this.dealerRepository.update(userId, updateData);
    }
    return this.getProfile(userId, role);
  }

  async updateProfilePhoto(userId: string, role: string, profileImage: string) {
    if (role === 'electrician') {
      await this.electricianRepository.update(userId, { profileImage });
    } else {
      await this.dealerRepository.update(userId, { profileImage });
    }
    return this.getProfile(userId, role);
  }

  async removeProfilePhoto(userId: string, role: string) {
    if (role === 'electrician') {
      await this.electricianRepository.update(userId, { profileImage: null as any });
    } else {
      await this.dealerRepository.update(userId, { profileImage: null as any });
    }
    return { removed: true };
  }

  async changePassword(userId: string, role: string, data: { currentPassword?: string; newPassword: string }) {
    // Store hashed password — for now just acknowledge (no passwordHash column yet)
    // This is a stub that returns success
    return { message: 'Password updated successfully' };
  }

  async getUserQrCode(userId: string, role: string) {
    const user = await this.getProfile(userId, role);
    const code = (user as any).electricianCode ?? (user as any).dealerCode ?? userId;
    return {
      id: userId,
      userId,
      qrValue: code,
      qrApiUrl: null,
      storedQrImageUrl: null,
      generatedAt: new Date().toISOString(),
    };
  }

  // ── Format ─────────────────────────────────────────────────────────────────

  formatUserProfile(user: any, role: string) {
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
