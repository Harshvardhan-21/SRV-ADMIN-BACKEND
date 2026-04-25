import {
  Controller,
  Get,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ScanService } from './scan.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserRole } from '../../common/enums';

@ApiTags('Scan Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('scans')
export class ScanController {
  constructor(private readonly scanService: ScanService) {}

  @Get()
  @ApiOperation({ summary: 'Get all scans' })
  @ApiResponse({ status: 200, description: 'List of scans' })
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('userId') userId?: string,
    @Query('productId') productId?: string,
    @Query('role') role?: UserRole,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.scanService.findAll(parseInt(page), parseInt(limit), userId, productId, role, dateFrom, dateTo);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get scan statistics' })
  @ApiResponse({ status: 200, description: 'Scan statistics' })
  getStats() {
    return this.scanService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get scan by ID' })
  @ApiResponse({ status: 200, description: 'Scan details' })
  findOne(@Param('id') id: string) {
    return this.scanService.findOne(id);
  }
}