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
import {
  MobileLoginDto,
  VerifyOtpDto,
  MobileRefreshDto,
  MobilePasswordLoginDto,
  SendSignupOtpDto,
  VerifySignupOtpDto,
  RegisterDealerDto,
  RegisterElectricianDto,
} from './dto/mobile-login.dto';
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

  @Post('password-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with phone and password' })
  passwordLogin(@Body() dto: MobilePasswordLoginDto) {
    return this.mobileAuthService.passwordLogin(dto);
  }

  @Post('signup/send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send signup OTP for dealer/electrician' })
  sendSignupOtp(@Body() dto: SendSignupOtpDto) {
    return this.mobileAuthService.sendSignupOtp(dto);
  }

  @Post('signup/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify signup OTP' })
  verifySignupOtp(@Body() dto: VerifySignupOtpDto) {
    return this.mobileAuthService.verifySignupOtp(dto);
  }

  @Post('signup/dealer')
  @ApiOperation({ summary: 'Register a dealer account' })
  registerDealer(@Body() dto: RegisterDealerDto) {
    return this.mobileAuthService.registerDealer(dto);
  }

  @Post('signup/electrician')
  @ApiOperation({ summary: 'Register an electrician account' })
  registerElectrician(@Body() dto: RegisterElectricianDto) {
    return this.mobileAuthService.registerElectrician(dto);
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

  @Post('logout')
  @UseGuards(MobileJwtGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  logout(@Request() req: any) {
    return this.mobileAuthService.logout(req.user.id, req.user.role);
  }
}
