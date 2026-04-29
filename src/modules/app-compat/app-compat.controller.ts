import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AppCompatService } from './app-compat.service';
import { MobileJwtGuard } from '../mobile-auth/mobile-jwt.guard';

@Controller()
export class AppCompatController {
  constructor(private readonly appCompatService: AppCompatService) {}

  @Post('auth/otp/send')
  sendOtp(@Body() body: any) {
    return this.appCompatService.sendOtp(body);
  }

  @Post('auth/otp/verify')
  verifyOtp(@Body() body: any) {
    return this.appCompatService.verifyOtp(body);
  }

  @Post('auth/login/otp')
  loginWithOtp(@Body() body: any) {
    return this.appCompatService.loginWithOtp(body);
  }

  @Post('auth/login/password')
  loginWithPassword(@Body() body: any) {
    return this.appCompatService.loginWithPassword(body);
  }

  @Post('auth/signup/electrician')
  signupElectrician(@Body() body: any) {
    return this.appCompatService.signupElectrician(body);
  }

  @Post('auth/signup/dealer')
  signupDealer(@Body() body: any) {
    return this.appCompatService.signupDealer(body);
  }

  @Post('auth/refresh')
  refresh(@Body() body: any) {
    return this.appCompatService.refresh(body);
  }

  @Get('catalog/categories')
  categories() {
    return this.appCompatService.categories();
  }

  @Get('catalog/products')
  products(@Query('search') search?: string, @Query('categoryId') categoryId?: string) {
    return this.appCompatService.products(search, categoryId);
  }

  @Get('catalog/products/:id')
  productById(@Param('id') id: string) {
    return this.appCompatService.productById(id);
  }

  @Get('catalog/reward-schemes')
  rewardSchemes(
    @Query('category') category?: string,
    @Query('role') role?: string,
    @Query('storeCategory') storeCategory?: string,
  ) {
    return this.appCompatService.rewardSchemes(category, role, storeCategory);
  }

  @Get('catalog/reward-store')
  rewardStore(@Query('role') role?: string) {
    return this.appCompatService.rewardStore(role);
  }

  @Get('content/testimonials')
  testimonials(@Query('role') role?: string) {
    return this.appCompatService.testimonials(role);
  }

  @Get('content/settings')
  settings() {
    return this.appCompatService.settings();
  }

  @Get('content/festival/active')
  activeFestival(@Query('timezone') timezone?: string) {
    return this.appCompatService.activeFestival(timezone);
  }

  @Get('content/festival/theme')
  festivalTheme(@Query('timezone') timezone?: string) {
    return this.appCompatService.activeFestival(timezone);
  }

  @Get('content/festival/upcoming')
  upcomingFestivals(@Query('timezone') timezone?: string) {
    return this.appCompatService.upcomingFestivals(timezone);
  }

  @Post('dealers/verify')
  verifyDealer(@Body() body: any) {
    return this.appCompatService.verifyDealer(body);
  }

  @UseGuards(MobileJwtGuard)
  @Get('dealers/electricians')
  dealerElectricians(@Req() req: any, @Query('search') search?: string) {
    return this.appCompatService.dealerElectricians(req.user.id, search);
  }

  @UseGuards(MobileJwtGuard)
  @Post('dealers/electricians/invite')
  inviteElectrician(@Req() req: any, @Body() body: any) {
    return this.appCompatService.inviteElectrician(req.user.id, body);
  }

  @UseGuards(MobileJwtGuard)
  @Post('dealers/electricians/verify')
  verifyElectricianInvite(@Req() req: any, @Body() body: any) {
    return this.appCompatService.verifyElectricianInvite(req.user.id, body);
  }

  @UseGuards(MobileJwtGuard)
  @Get('dealers/electricians/call-list')
  callList(@Req() req: any) {
    return this.appCompatService.callList(req.user.id);
  }

  @Post('dealers/approve')
  approveDealer(@Body() body: any) {
    return this.appCompatService.approveDealer(body);
  }

  @UseGuards(MobileJwtGuard)
  @Patch('profile')
  updateProfile(@Req() req: any, @Body() body: any) {
    return this.appCompatService.updateProfile(req.user.id, req.user.role, body);
  }

  @UseGuards(MobileJwtGuard)
  @Patch('profile/password')
  changePassword(@Req() req: any, @Body() body: any) {
    return this.appCompatService.changePassword(req.user.id, req.user.role, body);
  }

  @UseGuards(MobileJwtGuard)
  @Patch('profile/photo')
  updatePhoto(@Req() req: any, @Body() body: any) {
    return this.appCompatService.updatePhoto(req.user.id, req.user.role, body);
  }

  @UseGuards(MobileJwtGuard)
  @Delete('profile/photo')
  removePhoto(@Req() req: any) {
    return this.appCompatService.removePhoto(req.user.id, req.user.role);
  }

  @UseGuards(MobileJwtGuard)
  @Get('profile/photo/history')
  photoHistory(@Req() req: any) {
    return this.appCompatService.photoHistory(req.user.id, req.user.role);
  }

  @UseGuards(MobileJwtGuard)
  @Get('profile/qr-code')
  qrCode(@Req() req: any) {
    return this.appCompatService.qrCode(req.user.id, req.user.role);
  }

  @UseGuards(MobileJwtGuard)
  @Get('profile/notifications')
  profileNotifications(@Req() req: any) {
    return this.appCompatService.profileNotifications(req.user.id, req.user.role);
  }

  @UseGuards(MobileJwtGuard)
  @Patch('profile/notifications/:id/read')
  markNotificationRead(@Req() req: any, @Param('id') id: string) {
    return this.appCompatService.markNotificationRead(req.user.id, id);
  }

  @UseGuards(MobileJwtGuard)
  @Post('profile/support')
  createSupport(@Req() req: any, @Body() body: any) {
    return this.appCompatService.createSupport(req.user.id, req.user.role, body);
  }

  @UseGuards(MobileJwtGuard)
  @Get('profile/orders')
  orders(@Req() req: any) {
    return this.appCompatService.orders(req.user.id);
  }

  @UseGuards(MobileJwtGuard)
  @Get('profile/offers')
  profileOffers() {
    return this.appCompatService.profileOffers();
  }

  @UseGuards(MobileJwtGuard)
  @Get('profile/referral')
  referral(@Req() req: any) {
    return this.appCompatService.referral(req.user.id, req.user.role);
  }

  @UseGuards(MobileJwtGuard)
  @Post('profile/rating')
  submitRating(@Req() req: any, @Body() body: any) {
    return this.appCompatService.submitRating(req.user.id, req.user.role, body);
  }

  @UseGuards(MobileJwtGuard)
  @Get('profile/rating')
  myRating(@Req() req: any) {
    return this.appCompatService.myRating(req.user.id, req.user.role);
  }

  @UseGuards(MobileJwtGuard)
  @Post('scans/claim')
  claim(@Req() req: any, @Body() body: any) {
    return this.appCompatService.claim(req.user.id, req.user.role, body);
  }

  @UseGuards(MobileJwtGuard)
  @Get('scans/history')
  scanHistory(@Req() req: any) {
    return this.appCompatService.scanHistory(req.user.id);
  }

  @UseGuards(MobileJwtGuard)
  @Get('users/me')
  me(@Req() req: any) {
    return this.appCompatService.me(req.user.id, req.user.role);
  }

  @UseGuards(MobileJwtGuard)
  @Get('users/profile')
  profile(@Req() req: any) {
    return this.appCompatService.me(req.user.id, req.user.role);
  }

  @UseGuards(MobileJwtGuard)
  @Patch('users/me/preferences')
  updatePreferences(@Req() req: any, @Body() body: any) {
    return this.appCompatService.updatePreferences(req.user.id, req.user.role, body);
  }

  @Get('users/lookup/:code')
  lookupByCode(@Param('code') code: string) {
    return this.appCompatService.lookupByCode(code);
  }

  @Post('users/lookup')
  lookup(@Body() body: any) {
    return this.appCompatService.lookupByCode(body?.qrData ?? body?.code ?? body?.value ?? '');
  }

  @UseGuards(MobileJwtGuard)
  @Get('wallet')
  walletSummary(@Req() req: any) {
    return this.appCompatService.walletSummary(req.user.id, req.user.role);
  }

  @UseGuards(MobileJwtGuard)
  @Post('wallet/bank-account')
  saveBankAccount(@Req() req: any, @Body() body: any) {
    return this.appCompatService.saveBankAccount(req.user.id, req.user.role, body);
  }

  @UseGuards(MobileJwtGuard)
  @Post('wallet/redeem')
  redeem(@Req() req: any, @Body() body: any) {
    return this.appCompatService.redeem(req.user.id, req.user.role, body);
  }

  @UseGuards(MobileJwtGuard)
  @Post('wallet/transfer')
  transfer(@Req() req: any, @Body() body: any) {
    return this.appCompatService.transfer(req.user.id, req.user.role, body);
  }

  @UseGuards(MobileJwtGuard)
  @Get('wallet/redemptions')
  redemptions(@Req() req: any) {
    return this.appCompatService.redemptions(req.user.id);
  }

  @UseGuards(MobileJwtGuard)
  @Get('wallet/dealer-bonus')
  dealerBonus(@Req() req: any) {
    return this.appCompatService.dealerBonus(req.user.id);
  }

  @UseGuards(MobileJwtGuard)
  @Post('wallet/dealer-bonus/withdrawals')
  requestDealerBonusWithdrawal(@Req() req: any, @Body() body: any) {
    return this.appCompatService.requestDealerBonusWithdrawal(req.user.id, body);
  }
}
