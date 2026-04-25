import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { CreditWalletDto } from './dto/credit-wallet.dto';
import { DebitWalletDto } from './dto/debit-wallet.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TransactionType, TransactionSource, UserRole } from '../../common/enums';

@ApiTags('Wallet Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('transactions')
  @ApiOperation({ summary: 'Get wallet transactions' })
  @ApiResponse({ status: 200, description: 'List of transactions' })
  getTransactions(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('userId') userId?: string,
    @Query('userRole') userRole?: UserRole,
    @Query('type') type?: TransactionType,
    @Query('source') source?: TransactionSource,
  ) {
    return this.walletService.getTransactions(parseInt(page), parseInt(limit), userId, userRole, type, source);
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({ status: 200, description: 'Transaction details' })
  getTransaction(@Param('id') id: string) {
    return this.walletService.getTransaction(id);
  }

  @Post('credit')
  @ApiOperation({ summary: 'Credit wallet (admin only)' })
  @ApiResponse({ status: 201, description: 'Wallet credited successfully' })
  credit(@Body() creditWalletDto: CreditWalletDto, @CurrentUser('id') adminId: string) {
    return this.walletService.credit(creditWalletDto, adminId);
  }

  @Post('debit')
  @ApiOperation({ summary: 'Debit wallet (admin only)' })
  @ApiResponse({ status: 201, description: 'Wallet debited successfully' })
  debit(@Body() debitWalletDto: DebitWalletDto, @CurrentUser('id') adminId: string) {
    return this.walletService.debit(debitWalletDto, adminId);
  }
}