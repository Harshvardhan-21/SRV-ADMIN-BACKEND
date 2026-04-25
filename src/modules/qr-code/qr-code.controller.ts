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
  @ApiOperation({ summary: 'Generate QR codes for a product (up to 20,000)' })
  @ApiResponse({ status: 201, description: 'QR codes generated and saved to database' })
  generate(@Body() generateQrCodeDto: GenerateQrCodeDto) {
    return this.qrCodeService.generate(generateQrCodeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all QR codes (paginated)' })
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

  // NOTE: This route MUST come before /:id to avoid "delete-all" being treated as an id
  @Delete('delete-all')
  @ApiOperation({ summary: 'Delete all QR codes (optionally filter by productId)' })
  @ApiResponse({ status: 200, description: 'QR codes deleted' })
  removeAll(@Query('productId') productId?: string) {
    return this.qrCodeService.removeAll(productId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get QR code by ID' })
  @ApiResponse({ status: 200, description: 'QR code details' })
  findOne(@Param('id') id: string) {
    return this.qrCodeService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a single QR code by ID or code string' })
  @ApiResponse({ status: 200, description: 'QR code deleted successfully' })
  remove(@Param('id') id: string) {
    return this.qrCodeService.remove(id);
  }
}
