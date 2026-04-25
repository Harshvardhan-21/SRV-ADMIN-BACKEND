import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GiftService } from './gift.service';
import { CreateGiftProductDto } from './dto/create-gift-product.dto';
import { UpdateGiftProductDto } from './dto/update-gift-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Gift Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('gifts')
export class GiftController {
  constructor(private readonly giftService: GiftService) {}

  @Get('products')
  @ApiOperation({ summary: 'Get all gift products' })
  @ApiResponse({ status: 200, description: 'List of gift products' })
  getProducts(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.giftService.getProducts(parseInt(page), parseInt(limit));
  }

  @Post('products')
  @ApiOperation({ summary: 'Create new gift product' })
  @ApiResponse({ status: 201, description: 'Gift product created successfully' })
  createProduct(@Body() createGiftProductDto: CreateGiftProductDto) {
    return this.giftService.createProduct(createGiftProductDto);
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Update gift product' })
  @ApiResponse({ status: 200, description: 'Gift product updated successfully' })
  updateProduct(
    @Param('id') id: string,
    @Body() updateGiftProductDto: UpdateGiftProductDto,
  ) {
    return this.giftService.updateProduct(id, updateGiftProductDto);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Delete gift product' })
  @ApiResponse({ status: 200, description: 'Gift product deleted successfully' })
  deleteProduct(@Param('id') id: string) {
    return this.giftService.deleteProduct(id);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get gift orders' })
  @ApiResponse({ status: 200, description: 'List of gift orders' })
  getOrders(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
  ) {
    return this.giftService.getOrders(parseInt(page), parseInt(limit), status);
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Update gift order status' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  updateOrderStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.giftService.updateOrderStatus(id, status);
  }
}