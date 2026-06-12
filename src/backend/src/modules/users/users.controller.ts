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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UpdateMeDto, ChangePasswordDto } from './dto/update-user.dto';

@ApiTags('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@CurrentUser('id') userId: string) {
    return this.usersService.getMe(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  updateMe(
    @CurrentUser('id') userId: string,
    @Body() body: UpdateMeDto,
  ) {
    return this.usersService.updateMe(userId, body);
  }

  @Post('me/change-password')
  @ApiOperation({ summary: 'Change own password' })
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() body: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(userId, body.currentPassword, body.newPassword);
  }

  @Get()
  @Roles(Role.platform_admin)
  @ApiOperation({ summary: 'List all users (admin only)' })
  findAll(@Query() pagination: PaginationDto, @Query('role') role?: Role) {
    return this.usersService.findAll(pagination, role);
  }

  @Get(':id')
  @Roles(Role.platform_admin, Role.consultant)
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('role') role: Role,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.findOne(id, role, userId);
  }

  @Post(':id/block')
  @Roles(Role.platform_admin)
  @ApiOperation({ summary: 'Block a user (admin only)' })
  block(@CurrentUser('id') adminId: string, @Param('id') targetId: string) {
    return this.usersService.blockUser(adminId, targetId);
  }

  @Post(':id/unblock')
  @Roles(Role.platform_admin)
  @ApiOperation({ summary: 'Unblock a user (admin only)' })
  unblock(@CurrentUser('id') adminId: string, @Param('id') targetId: string) {
    return this.usersService.unblockUser(adminId, targetId);
  }

  @Delete(':id')
  @Roles(Role.platform_admin)
  @ApiOperation({ summary: 'Delete a user (admin only)' })
  delete(@CurrentUser('id') adminId: string, @Param('id') targetId: string) {
    return this.usersService.deleteUser(adminId, targetId);
  }
}
