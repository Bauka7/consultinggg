import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all categories' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get category by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Post()
  @Roles(Role.platform_admin)
  @ApiOperation({ summary: 'Create category (admin only)' })
  create(
    @Body()
    body: { id: string; name: string; slug: string; icon?: string; hue?: number; blurb?: string },
  ) {
    return this.categoriesService.create(body);
  }

  @Patch(':id')
  @Roles(Role.platform_admin)
  @ApiOperation({ summary: 'Update category (admin only)' })
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; slug?: string; icon?: string; hue?: number; blurb?: string },
  ) {
    return this.categoriesService.update(id, body);
  }

  @Delete(':id')
  @Roles(Role.platform_admin)
  @ApiOperation({ summary: 'Delete category (admin only)' })
  delete(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }
}
