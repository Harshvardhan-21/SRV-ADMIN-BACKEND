import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BannerService } from './banner.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Banner Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Post()
  @ApiOperation({ summary: 'Create new banner' })
  @ApiResponse({ status: 201, description: 'Banner created successfully' })
  create(@Body() createBannerDto: CreateBannerDto) {
    return this.bannerService.create(createBannerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all banners' })
  @ApiResponse({ status: 200, description: 'List of banners' })
  findAll() {
    return this.bannerService.findAll();
  }

  @Post('sync-status')
  @ApiOperation({ summary: 'Sync isActive field with status for all banners' })
  @ApiResponse({ status: 200, description: 'Banners synced successfully' })
  syncStatus() {
    return this.bannerService.syncIsActiveWithStatus();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get banner by ID' })
  @ApiResponse({ status: 200, description: 'Banner details' })
  findOne(@Param('id') id: string) {
    return this.bannerService.findOne(id);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Reorder banners' })
  @ApiResponse({ status: 200, description: 'Banners reordered successfully' })
  reorder(@Body() bannerOrders: { id: string; order: number }[]) {
    return this.bannerService.reorder(bannerOrders);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update banner' })
  @ApiResponse({ status: 200, description: 'Banner updated successfully' })
  update(@Param('id') id: string, @Body() updateBannerDto: UpdateBannerDto) {
    return this.bannerService.update(id, updateBannerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete banner' })
  @ApiResponse({ status: 200, description: 'Banner deleted successfully' })
  remove(@Param('id') id: string) {
    return this.bannerService.remove(id);
  }
}
