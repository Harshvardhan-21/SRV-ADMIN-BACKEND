import {
  Controller,
  Post,
  Get,
  Patch,
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

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() dto: MobileRefreshDto) {
    return this.mobileAuthService.refreshToken(dto.refreshToken);
  }

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
