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
import { Role } from '@prisma/client';
import { ConsultantsService } from './consultants.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateConsultantApplicationDto } from './dto/create-application.dto';
import { UpdateConsultantProfileDto } from './dto/update-profile.dto';

@ApiTags('consultants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('consultants')
export class ConsultantsController {
  constructor(private consultantsService: ConsultantsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List consultants (public)' })
  findAll(@Query() pagination: PaginationDto, @Query('categoryId') categoryId?: string) {
    return this.consultantsService.findAll(pagination, categoryId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get consultant profile (public)' })
  findOne(@Param('id') id: string) {
    return this.consultantsService.findOne(id);
  }

  @Public()
  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get approved reviews for a consultant' })
  getReviews(@Param('id') id: string, @Query() pagination: PaginationDto) {
    return this.consultantsService.getConsultantReviews(id, pagination);
  }

  @Get('me/profile')
  @Roles(Role.consultant)
  @ApiOperation({ summary: 'Get own consultant profile' })
  getMyProfile(@CurrentUser('id') userId: string) {
    return this.consultantsService.findByUserId(userId);
  }

  @Patch('me/profile')
  @Roles(Role.consultant)
  @ApiOperation({ summary: 'Update own consultant profile' })
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateConsultantProfileDto,
  ) {
    return this.consultantsService.updateProfile(userId, dto);
  }

  @Post('me/apply-factory/:factoryId')
  @Roles(Role.consultant)
  @ApiOperation({ summary: 'Apply to work with a factory' })
  applyToFactory(
    @CurrentUser('id') userId: string,
    @Param('factoryId') factoryId: string,
    @Body() body: { pitch?: string },
  ) {
    return this.consultantsService.applyToFactory(userId, factoryId, body.pitch);
  }

  @Public()
  @Post('apply')
  @ApiOperation({ summary: 'Submit consultant application (new applicant)' })
  submitApplication(@Body() dto: CreateConsultantApplicationDto) {
    return this.consultantsService.submitApplication(dto);
  }
}
