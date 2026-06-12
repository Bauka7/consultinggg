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
import { FactoriesService } from './factories.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateFactoryDto } from './dto/create-factory.dto';
import { UpdateFactoryDto } from './dto/update-factory.dto';

@ApiTags('factories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('factories')
export class FactoriesController {
  constructor(private factoriesService: FactoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List factories (public)' })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('categoryId') categoryId?: string,
    @Query('province') province?: string,
  ) {
    return this.factoriesService.findAll(pagination, categoryId, province);
  }

  // NOTE: /me routes must be declared before /:id so they aren't shadowed
  @Get('me/factory')
  @Roles(Role.factory_admin)
  @ApiOperation({ summary: 'Get the factory owned by current factory_admin' })
  getMyFactory(@CurrentUser('id') userId: string) {
    return this.factoriesService.findMyFactory(userId);
  }

  @Patch('me/factory')
  @Roles(Role.factory_admin)
  @ApiOperation({ summary: 'Update the factory owned by current factory_admin' })
  updateMyFactory(@CurrentUser('id') userId: string, @Body() dto: UpdateFactoryDto) {
    return this.factoriesService.updateMyFactory(userId, dto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get factory details' })
  findOne(@Param('id') id: string) {
    return this.factoriesService.findOne(id);
  }

  @Post()
  @Roles(Role.platform_admin)
  @ApiOperation({ summary: 'Create factory (admin only)' })
  create(@Body() dto: CreateFactoryDto) {
    return this.factoriesService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.platform_admin, Role.factory_admin)
  @ApiOperation({ summary: 'Update factory' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFactoryDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.factoriesService.update(id, dto, userId, role);
  }

  @Post(':id/verify')
  @Roles(Role.platform_admin)
  @ApiOperation({ summary: 'Verify factory (admin only)' })
  verify(@Param('id') id: string) {
    return this.factoriesService.verify(id);
  }

  @Get(':id/applications')
  @Roles(Role.platform_admin, Role.factory_admin)
  @ApiOperation({ summary: 'List consultant applications to this factory' })
  getApplications(
    @Param('id') factoryId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.factoriesService.getFactoryApplications(factoryId, userId, role);
  }

  @Post(':id/applications/:appId/approve')
  @Roles(Role.platform_admin, Role.factory_admin)
  @ApiOperation({ summary: 'Approve consultant application for factory' })
  approveApplication(
    @Param('id') factoryId: string,
    @Param('appId') appId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.factoriesService.approveConsultantApplication(appId, factoryId, userId, role);
  }

  @Post(':id/applications/:appId/reject')
  @Roles(Role.platform_admin, Role.factory_admin)
  @ApiOperation({ summary: 'Reject consultant application for factory' })
  rejectApplication(
    @Param('appId') appId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.factoriesService.rejectConsultantApplication(appId, userId, role);
  }
}
