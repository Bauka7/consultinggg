import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { InvitesService } from './invites.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CreateInviteDto } from './dto/create-invite.dto';

@ApiTags('invites')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invites')
export class InvitesController {
  constructor(private invitesService: InvitesService) {}

  @Post()
  @Roles(Role.platform_admin, Role.factory_admin)
  @ApiOperation({ summary: 'Create an invite (admin or factory_admin)' })
  create(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Body() dto: CreateInviteDto,
  ) {
    return this.invitesService.create(userId, role, dto);
  }

  @Public()
  @Get('validate/:token')
  @ApiOperation({ summary: 'Validate invite token (public)' })
  validate(@Param('token') token: string) {
    return this.invitesService.validate(token);
  }

  @Get()
  @Roles(Role.platform_admin, Role.factory_admin)
  @ApiOperation({ summary: 'List invites' })
  findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.invitesService.findAll(userId, role);
  }

  @Post(':id/revoke')
  @Roles(Role.platform_admin, Role.factory_admin)
  @ApiOperation({ summary: 'Revoke a pending invite' })
  revoke(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.invitesService.revoke(id, userId, role);
  }
}
