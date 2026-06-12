import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrderStatus, Role } from '@prisma/client';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UpdateOrderDto, UpdateTrackingDto } from './dto/update-order.dto';

@ApiTags('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List orders (filtered by role)' })
  findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Query() pagination: PaginationDto,
    @Query('status') status?: OrderStatus,
  ) {
    return this.ordersService.findAll(userId, role, pagination, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.ordersService.findOne(id, userId, role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order status/details' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.ordersService.updateStatus(id, dto, userId, role);
  }

  @Patch(':id/tracking')
  @ApiOperation({ summary: 'Update shipment tracking info' })
  updateTracking(
    @Param('id') id: string,
    @Body() body: UpdateTrackingDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.ordersService.updateTracking(id, body, userId, role);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get order status history' })
  getHistory(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.ordersService.getStatusHistory(id, userId, role);
  }
}
