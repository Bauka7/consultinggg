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
import { ReviewStatus, Role } from '@prisma/client';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateReviewDto } from './dto/create-review.dto';

@ApiTags('reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post()
  @Roles(Role.client)
  @ApiOperation({ summary: 'Submit a review (client only, goes to pending)' })
  create(@CurrentUser('id') authorId: string, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(authorId, dto);
  }

  @Get()
  @Roles(Role.platform_admin)
  @ApiOperation({ summary: 'List all reviews (admin only)' })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('status') status?: ReviewStatus,
    @Query('consultantId') consultantId?: string,
  ) {
    return this.reviewsService.findAll(pagination, status, consultantId);
  }

  @Get('pending')
  @Roles(Role.platform_admin)
  @ApiOperation({ summary: 'List pending reviews for moderation (admin only)' })
  findPending(@Query() pagination: PaginationDto) {
    return this.reviewsService.findPending(pagination);
  }

  @Get('flagged')
  @Roles(Role.platform_admin)
  @ApiOperation({ summary: 'List auto-flagged reviews (admin only)' })
  findFlagged(@Query() pagination: PaginationDto) {
    return this.reviewsService.findFlagged(pagination);
  }

  @Post(':id/approve')
  @Roles(Role.platform_admin)
  @ApiOperation({ summary: 'Approve a review (triggers rating recalculation)' })
  approve(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.reviewsService.approve(id, adminId);
  }

  @Post(':id/remove')
  @Roles(Role.platform_admin)
  @ApiOperation({ summary: 'Remove a review' })
  remove(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.reviewsService.remove(id, adminId);
  }
}
