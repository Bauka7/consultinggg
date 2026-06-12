import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Role, OrderStatus } from '@prisma/client';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ConsultantsService } from '../consultants/consultants.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

// Valid status transitions
const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.draft]: [OrderStatus.pending, OrderStatus.cancelled],
  [OrderStatus.pending]: [OrderStatus.confirmed, OrderStatus.cancelled],
  [OrderStatus.confirmed]: [OrderStatus.production, OrderStatus.cancelled],
  [OrderStatus.production]: [OrderStatus.qc, OrderStatus.cancelled],
  [OrderStatus.qc]: [OrderStatus.shipped, OrderStatus.production],
  [OrderStatus.shipped]: [OrderStatus.transit],
  [OrderStatus.transit]: [OrderStatus.delivered],
  [OrderStatus.delivered]: [OrderStatus.closed],
  [OrderStatus.closed]: [],
  [OrderStatus.cancelled]: [],
};

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private consultantsService: ConsultantsService,
  ) {}

  async findAll(userId: string, userRole: Role, pagination: PaginationDto, status?: OrderStatus) {
    const where: any = {};

    if (status) where.status = status;

    if (userRole === Role.client) {
      where.clientId = userId;
    } else if (userRole === Role.consultant) {
      const profile = await this.prisma.consultantProfile.findUnique({ where: { userId } });
      if (!profile) return paginate([], 0, pagination);
      where.consultantId = profile.id;
    } else if (userRole === Role.factory_admin) {
      const factory = await this.prisma.factory.findUnique({ where: { ownerUserId: userId } });
      if (!factory) return paginate([], 0, pagination);
      where.factoryId = factory.id;
    }

    if (pagination.search) {
      where.OR = [
        { id: { contains: pagination.search, mode: 'insensitive' } },
        { product: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          consultant: {
            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
          },
          factory: { select: { id: true, name: true, verified: true } },
          _count: { select: { statusHistory: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.order.count({ where }),
    ]);

    return paginate(items, total, pagination);
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        offer: {
          select: {
            id: true,
            unitPrice: true,
            total: true,
            note: true,
          },
        },
        consultant: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        },
        factory: true,
        statusHistory: {
          include: { actor: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
        threads: { select: { id: true, kind: true } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    this.checkAccess(order, userId, userRole);

    return order;
  }

  async updateStatus(
    orderId: string,
    dto: UpdateOrderDto,
    actorId: string,
    actorRole: Role,
  ) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    this.checkAccess(order, actorId, actorRole);

    const updateData: any = {};

    if (dto.status) {
      // Validate status transition
      const allowedNext = STATUS_TRANSITIONS[order.status] || [];
      if (!allowedNext.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot transition from ${order.status} to ${dto.status}. Allowed: ${allowedNext.join(', ')}`,
        );
      }

      updateData.status = dto.status;

      // Record status history
      await this.prisma.orderStatusHistory.create({
        data: {
          orderId,
          status: dto.status,
          note: dto.note,
          actorId,
        },
      });
    }

    if (dto.cargoCompany !== undefined) updateData.cargoCompany = dto.cargoCompany;
    if (dto.trackingNumber !== undefined) updateData.trackingNumber = dto.trackingNumber;
    if (dto.eta !== undefined) updateData.eta = new Date(dto.eta);
    if (dto.factoryId !== undefined) updateData.factoryId = dto.factoryId;

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        consultant: { include: { user: { select: { id: true, name: true } } } },
        factory: { select: { id: true, name: true } },
      },
    });

    // Business rule #4: Trial counter = CLOSED orders (not requests)
    // When order is closed, increment consultant's trial counter
    if (dto.status === OrderStatus.closed) {
      const consultantProfile = await this.prisma.consultantProfile.findUnique({
        where: { id: order.consultantId },
      });

      if (consultantProfile) {
        await this.consultantsService.onOrderClosed(consultantProfile.id);
      }
    }

    return updated;
  }

  async updateTracking(
    orderId: string,
    data: { cargoCompany?: string; trackingNumber?: string; eta?: string },
    actorId: string,
    actorRole: Role,
  ) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    this.checkAccess(order, actorId, actorRole);

    // Only consultant or platform_admin can update tracking
    if (actorRole !== Role.consultant && actorRole !== Role.platform_admin) {
      throw new ForbiddenException('Only consultants can update tracking information');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        cargoCompany: data.cargoCompany,
        trackingNumber: data.trackingNumber,
        eta: data.eta ? new Date(data.eta) : undefined,
      },
    });
  }

  async getStatusHistory(orderId: string, userId: string, userRole: Role) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    this.checkAccess(order, userId, userRole);

    return this.prisma.orderStatusHistory.findMany({
      where: { orderId },
      include: {
        actor: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async checkAccess(order: any, userId: string, userRole: Role) {
    if (userRole === Role.platform_admin) return;

    if (userRole === Role.client && order.clientId !== userId) {
      throw new ForbiddenException('No access to this order');
    }

    if (userRole === Role.consultant) {
      const profile = await this.prisma.consultantProfile.findUnique({ where: { userId } });
      if (!profile || order.consultantId !== profile.id) {
        throw new ForbiddenException('No access to this order');
      }
    }

    if (userRole === Role.factory_admin) {
      const factory = await this.prisma.factory.findUnique({ where: { ownerUserId: userId } });
      if (!factory || order.factoryId !== factory.id) {
        throw new ForbiddenException('No access to this order');
      }
    }
  }
}
