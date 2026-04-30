import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MobileAuthService } from './mobile-auth.service';
import { MobileLoginDto, VerifyOtpDto, MobileRefreshDto } from './dto/mobile-login.dto';
import { MobileJwtGuard } from './mobile-jwt.guard';

@ApiTags('Mobile App Auth')
@Controller('mobile/auth')
export class MobileAuthController {
  constructor(private readonly mobileAuthService: MobileAuthService) {}

  // ── Login ──────────────────────────────────────────────────────────────────

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to electrician/dealer phone' })
  sendOtp(@Body() dto: MobileLoginDto) {
    return this.mobileAuthService.sendOtp(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and get tokens' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.mobileAuthService.verifyOtp(dto);
  }

  @Post('password-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with phone + password' })
  passwordLogin(@Body() body: { phone: string; role: 'electrician' | 'dealer'; password: string }) {
    return this.mobileAuthService.passwordLogin(body.phone, body.role, body.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() dto: MobileRefreshDto) {
    return this.mobileAuthService.refreshToken(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout (client-side token invalidation)' })
  logout() {
    // JWT is stateless — client discards token. Return success.
    return { success: true, message: 'Logged out successfully' };
  }

  // ── Signup ─────────────────────────────────────────────────────────────────

  @Post('signup/send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP for new user signup' })
  sendSignupOtp(@Body() body: { phone: string; role: 'electrician' | 'dealer' }) {
    return this.mobileAuthService.sendSignupOtp(body.phone, body.role);
  }

  @Post('signup/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify signup OTP' })
  verifySignupOtp(@Body() body: { phone: string; role: 'electrician' | 'dealer'; otp: string }) {
    return this.mobileAuthService.verifySignupOtp(body.phone, body.role, body.otp);
  }

  @Post('signup/dealer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new dealer' })
  registerDealer(@Body() body: any) {
    return this.mobileAuthService.registerDealer(body);
  }

  @Post('signup/electrician')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new electrician' })
  registerElectrician(@Body() body: any) {
    return this.mobileAuthService.registerElectrician(body);
  }

  // ── Profile ────────────────────────────────────────────────────────────────

  @Get('profile')
  @UseGuards(MobileJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Request() req: any) {
    return this.mobileAuthService.getProfile(req.user.id, req.user.role);
  }

  @Patch('profile')
  @UseGuards(MobileJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update user profile' })
  updateProfile(@Request() req: any, @Body() data: any) {
    return this.mobileAuthService.updateProfile(req.user.id, req.user.role, data);
  }
}
