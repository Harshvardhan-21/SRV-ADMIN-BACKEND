import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Electrician } from '../../database/entities/electrician.entity';
import { Dealer } from '../../database/entities/dealer.entity';
import { MobileLoginDto, VerifyOtpDto } from './dto/mobile-login.dto';

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
    // Development mein fixed OTP, production mein SMS gateway use karein
    if (this.configService.get('NODE_ENV') === 'development') {
      return '1234';
    }
    return Math.floor(1000 + Math.random() * 9000).toString();
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

    const otp = this.generateOtp();
    const key = `${phone}:${role}`;
    otpStore.set(key, { otp, expiresAt: Date.now() + 5 * 60 * 1000 }); // 5 min expiry

    // TODO: Integrate SMS gateway here (Twilio / MSG91 / Fast2SMS)
    console.log(`[OTP] Phone: ${phone}, Role: ${role}, OTP: ${otp}`);

    return {
      success: true,
      message: 'OTP sent successfully',
      // In development, return OTP for testing
      ...(this.configService.get('NODE_ENV') === 'development' && { devOtp: otp }),
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { phone, role, otp } = dto;
    const key = `${phone}:${role}`;
    const stored = otpStore.get(key);

    if (!stored) {
      throw new BadRequestException('OTP not found or expired. Please request a new OTP.');
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(key);
      throw new BadRequestException('OTP expired. Please request a new OTP.');
    }

    if (stored.otp !== otp) {
      throw new UnauthorizedException('Invalid OTP.');
    }

    otpStore.delete(key);

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
