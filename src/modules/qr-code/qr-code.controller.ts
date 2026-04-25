import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QrCodeService } from './qr-code.service';
import { GenerateQrCodeDto } from './dto/generate-qr-code.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('QR Code Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('qr-codes')
export class QrCodeController {
  constructor(private readonly qrCodeService: QrCodeService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate QR codes for product' })
  @ApiResponse({ status: 201, description: 'QR codes generated successfully' })
  generate(@Body() generateQrCodeDto: GenerateQrCodeDto) {
    return this.qrCodeService.generate(generateQrCodeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all QR codes' })
  @ApiResponse({ status: 200, description: 'List of QR codes' })
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('productId') productId?: string,
    @Query('isScanned') isScanned?: string,
  ) {
    return this.qrCodeService.findAll(
      parseInt(page),
      parseInt(limit),
      productId,
      isScanned !== undefined ? isScanned === 'true' : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get QR code by ID' })
  @ApiResponse({ status: 200, description: 'QR code details' })
  findOne(@Param('id') id: string) {
    return this.qrCodeService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete QR code' })
  @ApiResponse({ status: 200, description: 'QR code deleted successfully' })
  remove(@Param('id') id: string) {
    return this.qrCodeService.remove(id);
  }
}