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
import { RequestStatus, Role } from '@prisma/client';
import { RequestsService } from './requests.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateRequestDto, UpdateRequestStatusDto, AssignConsultantDto } from './dto/create-request.dto';

@ApiTags('requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('requests')
export class RequestsController {
  constructor(private requestsService: RequestsService) {}

  @Post()
  @Roles(Role.client)
  @ApiOperation({ summary: 'Create a sourcing request (client only)' })
  create(@CurrentUser('id') clientId: string, @Body() dto: CreateRequestDto) {
    return this.requestsService.create(clientId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List requests (filtered by role)' })
  findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Query() pagination: PaginationDto,
    @Query('status') status?: RequestStatus,
  ) {
    return this.requestsService.findAll(userId, role, pagination, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get request details' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.requestsService.findOne(id, userId, role);
  }

  @Post(':id/decline')
  @Roles(Role.client)
  @ApiOperation({ summary: 'Decline a request (client only)' })
  decline(@Param('id') id: string, @CurrentUser('id') clientId: string) {
    return this.requestsService.decline(id, clientId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update request status' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateRequestStatusDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.requestsService.updateStatus(id, body.status, userId, role);
  }

  @Post(':id/assign')
  @Roles(Role.platform_admin)
  @ApiOperation({ summary: 'Manually assign consultant to request (admin only)' })
  assign(
    @Param('id') id: string,
    @Body() body: AssignConsultantDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.requestsService.assignConsultant(id, body.consultantId, adminId);
  }
}
