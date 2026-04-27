import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AppContentService } from './app-content.service';

@ApiTags('App Content Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('app-content')
export class AppContentController {
  constructor(private readonly appContentService: AppContentService) {}

  @Get('reward-schemes')
  @ApiOperation({ summary: 'Get all reward schemes' })
  @ApiResponse({ status: 200, description: 'List of reward schemes' })
  rewardSchemes(@Query('role') role?: string, @Query('active') active?: string) {
    return this.appContentService.rewardSchemes(role, active);
  }

  @Post('reward-schemes')
  @ApiOperation({ summary: 'Create reward scheme' })
  createRewardScheme(@Body() body: any) {
    return this.appContentService.createRewardScheme(body);
  }

  @Patch('reward-schemes/:id')
  @ApiOperation({ summary: 'Update reward scheme' })
  updateRewardScheme(@Param('id') id: string, @Body() body: any) {
    return this.appContentService.updateRewardScheme(id, body);
  }

  @Delete('reward-schemes/:id')
  @ApiOperation({ summary: 'Delete reward scheme' })
  deleteRewardScheme(@Param('id') id: string) {
    return this.appContentService.deleteRewardScheme(id);
  }

  @Get('festivals')
  @ApiOperation({ summary: 'Get all festivals' })
  @ApiResponse({ status: 200, description: 'List of festivals' })
  festivals() {
    return this.appContentService.festivals();
  }

  @Post('festivals')
  @ApiOperation({ summary: 'Create festival' })
  createFestival(@Body() body: any) {
    return this.appContentService.createFestival(body);
  }

  @Patch('festivals/:id')
  @ApiOperation({ summary: 'Update festival' })
  updateFestival(@Param('id') id: string, @Body() body: any) {
    return this.appContentService.updateFestival(id, body);
  }

  @Delete('festivals/:id')
  @ApiOperation({ summary: 'Delete festival' })
  deleteFestival(@Param('id') id: string) {
    return this.appContentService.deleteFestival(id);
  }
}
