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
import { ElectricianService } from './electrician.service';
import { CreateElectricianDto } from './dto/create-electrician.dto';
import { UpdateElectricianDto } from './dto/update-electrician.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserStatus, MemberTier } from '../../common/enums';

@ApiTags('Electrician Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('electricians')
export class ElectricianController {
  constructor(private readonly electricianService: ElectricianService) {}

  @Post()
  @ApiOperation({ summary: 'Create new electrician' })
  @ApiResponse({ status: 201, description: 'Electrician created successfully' })
  create(@Body() createElectricianDto: CreateElectricianDto) {
    return this.electricianService.create(createElectricianDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all electricians' })
  @ApiResponse({ status: 200, description: 'List of electricians' })
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
    @Query('status') status?: UserStatus,
    @Query('tier') tier?: MemberTier,
    @Query('state') state?: string,
    @Query('dealerId') dealerId?: string,
  ) {
    return this.electricianService.findAll(parseInt(page), parseInt(limit), search, status, tier, state, dealerId);
  }

  @Get('tier-counts')
  @ApiOperation({ summary: 'Get electrician tier distribution counts' })
  @ApiResponse({ status: 200, description: 'Tier counts' })
  getTierCounts() {
    return this.electricianService.getTierCounts();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get electrician by ID' })
  @ApiResponse({ status: 200, description: 'Electrician details' })
  findOne(@Param('id') id: string) {
    return this.electricianService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update electrician' })
  @ApiResponse({ status: 200, description: 'Electrician updated successfully' })
  update(@Param('id') id: string, @Body() updateElectricianDto: UpdateElectricianDto) {
    return this.electricianService.update(id, updateElectricianDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update electrician status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  updateStatus(@Param('id') id: string, @Body('status') status: UserStatus) {
    return this.electricianService.updateStatus(id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete electrician' })
  @ApiResponse({ status: 200, description: 'Electrician deleted successfully' })
  remove(@Param('id') id: string) {
    return this.electricianService.remove(id);
  }

  @Get(':id/scans')
  @ApiOperation({ summary: 'Get electrician scan history' })
  @ApiResponse({ status: 200, description: 'Scan history' })
  getScans(
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.electricianService.getElectricianScans(id, parseInt(page), parseInt(limit));
  }

  @Get(':id/wallet')
  @ApiOperation({ summary: 'Get electrician wallet transactions' })
  @ApiResponse({ status: 200, description: 'Wallet transactions' })
  getWallet(
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.electricianService.getElectricianWallet(id, parseInt(page), parseInt(limit));
  }
}