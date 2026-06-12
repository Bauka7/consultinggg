import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApplicationStatus, Role } from '@prisma/client';
import { IsIn, IsOptional } from 'class-validator';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UpdatePlatformSettingsDto } from './dto/platform-settings.dto';
import { ModerateApplicationDto } from './dto/moderate-application.dto';

class SetConsultantTypeDto {
  @IsIn(['specialized', 'general'])
  type: 'specialized' | 'general';
}

@ApiTags('admin')
@Roles(Role.platform_admin)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ─── Dashboard ────────────────────────────────────────────────────────────
  @Get('dashboard')
  @ApiOperation({ summary: 'Platform-wide stats for admin overview' })
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  // ─── Settings ────────────────────────────────────────────────────────────
  @Get('settings')
  @ApiOperation({ summary: 'Get platform settings' })
  getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update platform settings (thresholds, auto-rules, etc.)' })
  updateSettings(@Body() dto: UpdatePlatformSettingsDto, @CurrentUser('id') adminId: string) {
    return this.adminService.updateSettings(dto, adminId);
  }

  // ─── Users ───────────────────────────────────────────────────────────────
  @Get('users')
  @ApiOperation({ summary: 'List all users with filters' })
  getUsers(
    @Query() pagination: PaginationDto,
    @Query('role') role?: Role,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllUsers(pagination, role, status);
  }

  @Post('users/:id/block')
  @ApiOperation({ summary: 'Block a user' })
  blockUser(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.adminService.blockUser(id, adminId);
  }

  @Post('users/:id/unblock')
  @ApiOperation({ summary: 'Unblock a user' })
  unblockUser(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.adminService.unblockUser(id, adminId);
  }

  // ─── Consultant Applications ──────────────────────────────────────────────
  @Get('consultant-applications')
  @ApiOperation({ summary: 'List consultant applications by status' })
  getConsultantApplications(
    @Query() pagination: PaginationDto,
    @Query('status') status?: ApplicationStatus,
  ) {
    return this.adminService.getConsultantApplications(pagination, status);
  }

  @Post('consultant-applications/:id/moderate')
  @ApiOperation({ summary: 'Approve (trial / approved) or reject a consultant application' })
  moderateApplication(
    @Param('id') id: string,
    @Body() dto: ModerateApplicationDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.moderateApplication(id, dto, adminId);
  }

  @Post('consultants/:id/verify')
  @ApiOperation({ summary: 'Verify a consultant profile' })
  verifyConsultant(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.adminService.verifyConsultant(id, adminId);
  }

  @Patch('consultants/:id/type')
  @ApiOperation({ summary: 'Change consultant type (specialized / general)' })
  setConsultantType(
    @Param('id') id: string,
    @Body() dto: SetConsultantTypeDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.setConsultantType(id, dto.type, adminId);
  }

  // ─── Factories ────────────────────────────────────────────────────────────
  @Get('factories')
  @ApiOperation({ summary: 'List all factories' })
  getFactories(
    @Query() pagination: PaginationDto,
    @Query('verified') verified?: string,
  ) {
    const v = verified === 'true' ? true : verified === 'false' ? false : undefined;
    return this.adminService.getAllFactories(pagination, v);
  }

  @Post('factories/:id/verify')
  @ApiOperation({ summary: 'Mark factory as verified' })
  verifyFactory(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.adminService.verifyFactory(id, adminId);
  }

  @Post('factories/:id/unverify')
  @ApiOperation({ summary: 'Remove factory verification' })
  unverifyFactory(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.adminService.unverifyFactory(id, adminId);
  }

  // ─── Factory–Consultant Applications ─────────────────────────────────────
  @Get('factory-applications')
  @ApiOperation({ summary: 'List all factory-consultant link applications' })
  getFactoryApplications(
    @Query() pagination: PaginationDto,
    @Query('status') status?: ApplicationStatus,
  ) {
    return this.adminService.getFactoryApplications(pagination, status);
  }

  // ─── Orders ───────────────────────────────────────────────────────────────
  @Get('orders')
  @ApiOperation({ summary: 'List all orders on the platform' })
  getOrders(@Query() pagination: PaginationDto, @Query('status') status?: string) {
    return this.adminService.getAllOrders(pagination, status);
  }

  // ─── Reviews ──────────────────────────────────────────────────────────────
  @Get('reviews/pending')
  @ApiOperation({ summary: 'Reviews pending moderation' })
  getPendingReviews(@Query() pagination: PaginationDto) {
    return this.adminService.getPendingReviews(pagination);
  }

  // ─── Audit Logs ───────────────────────────────────────────────────────────
  @Get('audit-logs')
  @ApiOperation({ summary: 'Platform audit log' })
  getAuditLogs(@Query() pagination: PaginationDto, @Query('actorId') actorId?: string) {
    return this.adminService.getAuditLogs(pagination, actorId);
  }
}

