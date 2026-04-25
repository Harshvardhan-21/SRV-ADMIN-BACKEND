import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { TransferPointsDto } from './dto/transfer-points.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TransactionType, UserRole } from '../../common/enums';

@ApiTags('Finance Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get financial summary' })
  @ApiResponse({ status: 200, description: 'Financial summary' })
  getSummary() {
    return this.financeService.getSummary();
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get all financial transactions' })
  @ApiResponse({ status: 200, description: 'List of transactions' })
  getTransactions(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('type') type?: TransactionType,
    @Query('userRole') userRole?: UserRole,
  ) {
    return this.financeService.getTransactions(parseInt(page), parseInt(limit), type, userRole);
  }

  @Get('dealer-bonus')
  @ApiOperation({ summary: 'Get dealer bonus summary' })
  @ApiResponse({ status: 200, description: 'Dealer bonus summary' })
  getDealerBonus() {
    return this.financeService.getDealerBonus();
  }

  @Post('dealer-bonus/transfer')
  @ApiOperation({ summary: 'Transfer dealer bonus' })
  @ApiResponse({ status: 201, description: 'Bonus transferred successfully' })
  transferDealerBonus(
    @Body() transferData: { dealerId: string; amount: number; description?: string },
    @CurrentUser('id') adminId: string,
  ) {
    return this.financeService.transferDealerBonus(transferData, adminId);
  }

  @Get('transfer-points')
  @ApiOperation({ summary: 'Get points transfer history' })
  @ApiResponse({ status: 200, description: 'Points transfer history' })
  getTransferPoints() {
    return this.financeService.getTransferPoints();
  }

  @Post('transfer-points')
  @ApiOperation({ summary: 'Manually transfer points between users' })
  @ApiResponse({ status: 201, description: 'Points transferred successfully' })
  transferPoints(
    @Body() body: { fromUser: string; toUser: string; points: number; reason?: string },
    @CurrentUser('id') adminId: string,
  ) {
    return this.financeService.manualTransferPoints(body, adminId);
  }
}