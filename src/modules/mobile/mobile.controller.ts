import {
  Controller,
  Get,
  Post,
  Patch,
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

  @Get('products/categories')
  @ApiOperation({ summary: 'Get all product categories for app' })
  getProductCategories() {
    return this.mobileService.getProductCategories();
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

  @Get('electricians/call-list')
  @UseGuards(MobileJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get call list of electricians for dealer' })
  getDealerCallList(@Request() req: any) {
    return this.mobileService.getDealerCallList(req.user.id);
  }

  @Get('electricians')
  @UseGuards(MobileJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get electricians for current dealer' })
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

  @Get('festival/theme')
  @ApiOperation({ summary: 'Get active festival theme for app' })
  getFestivalTheme(@Query('timezone') timezone?: string) {
    return this.mobileService.getFestivalTheme(timezone);
  }

  // ── Wallet operations ───────────────────────────────────────────────

  @Post('wallet/bank-account')
  @UseGuards(MobileJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Save bank account details' })
  saveBankAccount(@Request() req: any, @Body() body: any) {
    return this.mobileService.saveBankAccount(req.user.id, req.user.role, body);
  }

  @Post('wallet/redeem')
  @UseGuards(MobileJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Redeem reward' })
  redeemReward(@Request() req: any, @Body() body: { schemeId: string; note?: string }) {
    return this.mobileService.redeemReward(req.user.id, req.user.role, body);
  }

  @Post('wallet/transfer')
  @UseGuards(MobileJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Transfer points to another user' })
  transferPoints(@Request() req: any, @Body() body: { receiverPhone: string; points: number }) {
    return this.mobileService.transferPoints(req.user.id, req.user.role, body);
  }

  @Get('wallet/dealer-bonus')
  @UseGuards(MobileJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get dealer bonus info' })
  getDealerBonus(@Request() req: any) {
    return this.mobileService.getDealerBonus(req.user.id);
  }

  @Post('wallet/dealer-bonus/withdrawals')
  @UseGuards(MobileJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Request dealer bonus withdrawal' })
  requestDealerBonusWithdrawal(@Request() req: any, @Body() body: { amount: number }) {
    return this.mobileService.requestDealerBonusWithdrawal(req.user.id, body.amount);
  }

  // ── Profile operations ──────────────────────────────────────────────

  @Get('profile/qr-code')
  @UseGuards(MobileJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user QR code' })
  getUserQrCode(@Request() req: any) {
    return this.mobileService.getUserQrCode(req.user.id, req.user.role);
  }

  @Patch('profile/photo')
  @UseGuards(MobileJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload profile photo' })
  uploadProfilePhoto(@Request() req: any, @Body() body: { profileImage: string; source?: string }) {
    return this.mobileService.uploadProfilePhoto(req.user.id, req.user.role, body.profileImage, body.source);
  }

  @Delete('profile/photo')
  @UseGuards(MobileJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove profile photo' })
  removeProfilePhoto(@Request() req: any) {
    return this.mobileService.removeProfilePhoto(req.user.id, req.user.role);
  }

  @Patch('profile/password')
  @UseGuards(MobileJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change password' })
  changePassword(@Request() req: any, @Body() body: { currentPassword?: string; newPassword: string }) {
    return this.mobileService.changePassword(req.user.id, req.user.role, body);
  }

  // ── Support ─────────────────────────────────────────────────────────

  @Post('support')
  @UseGuards(MobileJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Submit support ticket' })
  createSupportTicket(@Request() req: any, @Body() body: { subject: string; comment: string; photoUrl?: string }) {
    return this.mobileService.createSupportTicket(req.user.id, req.user.role, body);
  }

  // ── Referral ─────────────────────────────────────────────────────────────

  @Get('referral')
  @UseGuards(MobileJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my referral code and share link' })
  getMyReferral(@Request() req: any) {
    return this.mobileService.getMyReferral(req.user.id, req.user.role);
  }

  // ── Rating ──────────────────────────────────────────────────────────

  @Post('rating')
  @UseGuards(MobileJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Submit app rating' })
  submitRating(@Request() req: any, @Body() body: { rating: number; review?: string }) {
    return this.mobileService.submitRating(req.user.id, req.user.role, body.rating, body.review);
  }

  @Get('rating')
  @UseGuards(MobileJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my app rating' })
  getMyRating(@Request() req: any) {
    return this.mobileService.getMyRating(req.user.id);
  }

  // ── Reward schemes ──────────────────────────────────────────────────

  @Get('reward-schemes')
  @ApiOperation({ summary: 'Get reward schemes' })
  getRewardSchemes(@Query('category') category?: string) {
    return this.mobileService.getRewardSchemes(category);
  }

  @Get('gift-products')
  @ApiOperation({ summary: 'Get gift store products for app' })
  getGiftProducts(@Query('role') role?: string) {
    return this.mobileService.getGiftProducts(role);
  }
}
