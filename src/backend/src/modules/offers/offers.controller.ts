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
import { OfferStatus, Role } from '@prisma/client';
import { OffersService } from './offers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateOfferDto, RevisionOfferDto } from './dto/create-offer.dto';

@ApiTags('offers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('offers')
export class OffersController {
  constructor(private offersService: OffersService) {}

  @Post()
  @Roles(Role.consultant)
  @ApiOperation({ summary: 'Create an offer for a request (consultant only)' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateOfferDto) {
    return this.offersService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List offers — all for current user, or by ?requestId=' })
  findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Query() pagination: PaginationDto,
    @Query('requestId') requestId?: string,
    @Query('status') status?: OfferStatus,
  ) {
    if (requestId) {
      return this.offersService.findByRequest(requestId, userId, role);
    }
    return this.offersService.findAll(userId, role, pagination, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get offer details' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.offersService.findOne(id, userId, role);
  }

  @Post(':id/accept')
  @Roles(Role.client)
  @ApiOperation({ summary: 'Accept an offer and create order (client only)' })
  accept(@Param('id') id: string, @CurrentUser('id') clientId: string) {
    return this.offersService.accept(id, clientId);
  }

  @Post(':id/revision')
  @Roles(Role.client)
  @ApiOperation({ summary: 'Request revision of an offer (client only)' })
  revision(
    @Param('id') id: string,
    @CurrentUser('id') clientId: string,
    @Body() body: RevisionOfferDto,
  ) {
    return this.offersService.requestRevision(id, clientId, body.note);
  }

  @Post(':id/expire')
  @Roles(Role.platform_admin, Role.consultant)
  @ApiOperation({ summary: 'Manually expire an offer' })
  expire(@Param('id') id: string) {
    return this.offersService.expireOffer(id);
  }
}
