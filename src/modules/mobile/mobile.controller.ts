import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MobileService } from './mobile.service';
import { MobileJwtGuard } from '../mobile-auth/mobile-jwt.guard';

@ApiTags('Mobile App')
@Controller('mobile')
export class MobileController {
  constructor(private readonly mobileService: MobileService) {}

  // ── Public endpoints (no auth needed) ──────────────────────────────

  @Get('products')
  @ApiOperation({ summary: 'Get all active products for app' })
  getProducts(@Query('category') category?: string) {
    return this.mobileService.getProducts(category);
  }

  @Get('banners')
  @ApiOperation({ summary: 'Get active banners for app' })
  getBanners(@Query('role') role?: string) {
    console.log('=== BANNER API CALLED ===');
    return this.mobileService.getBanners(role);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get notifications for app' })
  getNotifications(@Query('role') role?: string, @Query('userId') userId?: string) {
    return this.mobileService.getNotifications(userId, role);
  }

  @Delete('notifications/:id')
  @UseGuards(MobileJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a notification' })
  deleteNotification(@Param('id') id: string) {
    return this.mobileService.deleteNotification(id);
  }

  @Get('settings/maintenance')
  @ApiOperation({ summary: 'Get maintenance mode status' })
  getMaintenance() {
    return this.mobileService.getMaintenanceMode();
  }

  @Get('offers')
  @ApiOperation({ summary: 'Get active offers/rewards for app' })
  getOffers(@Query('role') role?: string) {
    return this.mobileService.getOffers(role);
  }

  @Get('testimonials')
  @ApiOperation({ summary: 'Get active testimonials for app' })
  getTestimonials() {
    return this.mobileService.getTestimonials();
  }

  @Get('dealer/by-phone')
  @ApiOperation({ summary: 'Lookup dealer by phone number (for electrician onboarding)' })
  getDealerByPhone(@Query('phone') phone: string) {
    return this.mobileService.getDealerByPhone(phone);
  }

  // ── Protected endpoints (require mobile JWT) ────────────────────────

  @Post('scan')
  @UseGuards(MobileJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit a QR scan and earn points' })
  submitScan(@Request() req: any, @Body() body: { qrCode: string; mode: 'single' | 'multi' }) {
    return this.mobileService.submitScan(req.user.id, req.user.role, body.qrCode, body.mode);
  }

  @Get('wallet')
  @UseGuards(MobileJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get wallet balance and transaction history' })
  getWallet(
    @Request() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.mobileService.getWallet(req.user.id, req.user.role, parseInt(page), parseInt(limit));
  }

  @Get('scan-history')
  @UseGuards(MobileJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get scan history for current user' })
  getScanHistory(
    @Request() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.mobileService.getScanHistory(req.user.id, parseInt(page), parseInt(limit));
  }

  @Get('electricians')
  @UseGuards(MobileJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get electricians for dealer' })
  getDealerElectricians(
    @Request() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('search') search?: string,
  ) {
    return this.mobileService.getDealerElectricians(req.user.id, parseInt(page), parseInt(limit), search);
  }

  @Post('electricians')
  @UseGuards(MobileJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add electrician to dealer network' })
  addElectrician(@Request() req: any, @Body() body: any) {
    return this.mobileService.addElectrician(req.user.id, body);
  }

  @Get('redemptions')
  @UseGuards(MobileJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get redemption history for current user' })
  getRedemptionHistory(
    @Request() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.mobileService.getRedemptionHistory(req.user.id, parseInt(page), parseInt(limit));
  }

  @Get('app-settings')
  @ApiOperation({ summary: 'Get public app settings (maintenance mode, support info)' })
  getAppSettings() {
    return this.mobileService.getAppSettings();
  }
}
