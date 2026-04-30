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
  Put,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRole } from '../../common/enums';

@ApiTags('Admin Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admins')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create new admin (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Admin created successfully' })
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  @Get()
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all admins (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'List of admins' })
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.adminService.findAll(parseInt(page), parseInt(limit), search);
  }

  @Get(':id')
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get admin by ID (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Admin details' })
  findOne(@Param('id') id: string) {
    return this.adminService.findOne(id);
  }

  @Patch(':id')
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update admin (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Admin updated successfully' })
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminService.update(id, updateAdminDto);
  }

  @Delete(':id')
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete admin (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Admin deleted successfully' })
  remove(@Param('id') id: string) {
    return this.adminService.remove(id);
  }

  @Get(':id/permissions')
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get admin permissions (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Admin permissions' })
  getPermissions(@Param('id') id: string) {
    return this.adminService.getPermissions(id);
  }

  @Put(':id/permissions')
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update admin permissions (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Permissions updated successfully' })
  updatePermissions(@Param('id') id: string, @Body() updatePermissionsDto: any) {
    return this.adminService.updatePermissions(id, updatePermissionsDto);
  }
}
