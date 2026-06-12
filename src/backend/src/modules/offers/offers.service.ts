import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Role, OfferStatus, OrderStatus } from '@prisma/client';
import { CreateOfferDto } from './dto/create-offer.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class OffersService {
  constructor(private prisma: PrismaService) {}

  // List all offers visible to the current user (role-scoped)
  async findAll(userId: string, userRole: Role, pagination: PaginationDto, status?: OfferStatus) {
    const where: any = {};
    if (status) where.status = status;

    if (userRole === Role.client) {
      where.request = { clientId: userId };
      // Clients never see expired offers in their list
      if (!status) where.status = { not: OfferStatus.expired };
    } else if (userRole === Role.consultant) {
      const profile = await this.prisma.consultantProfile.findUnique({ where: { userId } });
      if (!profile) return paginate([], 0, pagination);
      where.consultantId = profile.id;
    }
    // platform_admin sees all

    const [items, total] = await Promise.all([
      this.prisma.offer.findMany({
        where,
        include: {
          request: { select: { id: true, product: true, categoryId: true, clientId: true } },
          consultant: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
          order: { select: { id: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.offer.count({ where }),
    ]);

    return paginate(items, total, pagination);
  }

  async create(consultantUserId: string, dto: CreateOfferDto) {
    const profile = await this.prisma.consultantProfile.findUnique({
      where: { userId: consultantUserId },
    });
    if (!profile) throw new NotFoundException('Consultant profile not found');

    const request = await this.prisma.request.findUnique({
      where: { id: dto.requestId },
    });
    if (!request) throw new NotFoundException('Request not found');

    // Only the assigned consultant can create offers for this request
    if (request.consultantId !== profile.id) {
      throw new ForbiddenException('You are not assigned to this request');
    }

    if (request.status === 'done' || request.status === 'declined') {
      throw new BadRequestException('Cannot create offer for closed request');
    }

    // Validate the factory (which will fulfill the order) if provided
    if (dto.factoryId) {
      const factory = await this.prisma.factory.findUnique({ where: { id: dto.factoryId } });
      if (!factory) throw new NotFoundException('Factory not found');
    }

    const offer = await this.prisma.offer.create({
      data: {
        requestId: dto.requestId,
        consultantId: profile.id,
        factoryId: dto.factoryId,
        product: dto.product,
        qty: dto.qty,
        unitPrice: dto.unitPrice,
        total: dto.total,
        leadTime: dto.leadTime,
        incoterm: dto.incoterm,
        note: dto.note,
        validTill: dto.validTill ? new Date(dto.validTill) : undefined,
        status: OfferStatus.pending,
      },
      include: {
        request: { select: { id: true, product: true, clientId: true } },
        consultant: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Update request status to 'wait' (waiting for client decision)
    await this.prisma.request.update({
      where: { id: dto.requestId },
      data: { status: 'wait' },
    });

    // Open the hidden consultant↔factory line for this request (invisible to client)
    if (dto.factoryId) {
      const existing = await this.prisma.thread.findFirst({
        where: { kind: 'factory', consultantId: profile.id, factoryId: dto.factoryId, requestId: dto.requestId },
      });
      if (!existing) {
        await this.prisma.thread.create({
          data: {
            kind: 'factory',
            consultantId: profile.id,
            factoryId: dto.factoryId,
            requestId: dto.requestId,
          },
        });
      }
    }

    return offer;
  }

  async findByRequest(requestId: string, userId: string, userRole: Role) {
    const request = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');

    // Access control
    if (userRole === Role.client && request.clientId !== userId) {
      throw new ForbiddenException('No access');
    }

    if (userRole === Role.consultant) {
      const profile = await this.prisma.consultantProfile.findUnique({ where: { userId } });
      if (!profile || request.consultantId !== profile.id) {
        throw new ForbiddenException('No access');
      }
    }

    const where: any = { requestId };
    // Client only sees non-expired offers
    if (userRole === Role.client) {
      where.status = { not: OfferStatus.expired };
    }

    return this.prisma.offer.findMany({
      where,
      include: {
        consultant: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const offer = await this.prisma.offer.findUnique({
      where: { id },
      include: {
        request: true,
        consultant: {
          include: { user: { select: { id: true, name: true } } },
        },
        order: true,
      },
    });

    if (!offer) throw new NotFoundException('Offer not found');

    if (userRole === Role.client && offer.request.clientId !== userId) {
      throw new ForbiddenException('No access');
    }

    if (userRole === Role.consultant) {
      const profile = await this.prisma.consultantProfile.findUnique({ where: { userId } });
      if (!profile || offer.consultantId !== profile.id) {
        throw new ForbiddenException('No access');
      }
    }

    return offer;
  }

  async accept(offerId: string, clientId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: { request: true, order: true },
    });

    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.request.clientId !== clientId) throw new ForbiddenException('No permission');
    if (offer.status !== OfferStatus.pending) {
      throw new BadRequestException(`Offer is ${offer.status}, cannot accept`);
    }

    if (offer.order) {
      throw new BadRequestException('Offer already has an associated order');
    }

    // Check if offer has expired
    if (offer.validTill && offer.validTill < new Date()) {
      await this.prisma.offer.update({
        where: { id: offerId },
        data: { status: OfferStatus.expired },
      });
      throw new BadRequestException('Offer has expired');
    }

    // Generate order ID: TW-XXXX (sequential, zero-padded)
    const orderCount = await this.prisma.order.count();
    const orderId = `TW-${String(orderCount + 1).padStart(4, '0')}`;

    const order = await this.prisma.$transaction(async (tx) => {
      // Mark offer as accepted
      await tx.offer.update({
        where: { id: offerId },
        data: { status: OfferStatus.accepted },
      });

      // Expire all other pending offers for this request
      await tx.offer.updateMany({
        where: {
          requestId: offer.requestId,
          id: { not: offerId },
          status: OfferStatus.pending,
        },
        data: { status: OfferStatus.expired },
      });

      // Create order — links to the factory chosen by the consultant in the offer,
      // so the factory_admin receives and manages it.
      const newOrder = await tx.order.create({
        data: {
          id: orderId,
          offerId,
          clientId,
          consultantId: offer.consultantId,
          factoryId: offer.factoryId,
          product: offer.product,
          qty: offer.qty,
          unitPrice: offer.unitPrice,
          total: offer.total,
          incoterm: offer.incoterm,
          status: OrderStatus.pending,
        },
        include: {
          offer: { include: { consultant: { include: { user: { select: { id: true, name: true } } } } } },
        },
      });

      // Create order thread for client-consultant communication
      await tx.thread.create({
        data: {
          kind: 'client',
          clientId,
          consultantId: offer.consultantId,
          orderId: newOrder.id,
        },
      });

      // Hidden consultant↔factory line scoped to this order (client never sees it)
      if (offer.factoryId) {
        await tx.thread.create({
          data: {
            kind: 'factory',
            consultantId: offer.consultantId,
            factoryId: offer.factoryId,
            orderId: newOrder.id,
          },
        });
      }

      // Record initial status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: newOrder.id,
          status: OrderStatus.pending,
          note: 'Order created from accepted offer',
          actorId: clientId,
        },
      });

      // Mark request as done
      await tx.request.update({
        where: { id: offer.requestId },
        data: { status: 'done' },
      });

      return newOrder;
    });

    return order;
  }

  async requestRevision(offerId: string, clientId: string, note?: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: { request: true },
    });

    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.request.clientId !== clientId) throw new ForbiddenException('No permission');
    if (offer.status !== OfferStatus.pending) {
      throw new BadRequestException(`Offer is ${offer.status}, cannot request revision`);
    }

    const updated = await this.prisma.offer.update({
      where: { id: offerId },
      data: { status: OfferStatus.revision, note: note || offer.note },
    });

    // Move request back to work status for consultant to revise
    await this.prisma.request.update({
      where: { id: offer.requestId },
      data: { status: 'work' },
    });

    return updated;
  }

  async expireOffer(offerId: string) {
    const offer = await this.prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer) throw new NotFoundException('Offer not found');

    return this.prisma.offer.update({
      where: { id: offerId },
      data: { status: OfferStatus.expired },
    });
  }

  async expireOutdatedOffers() {
    const now = new Date();
    const result = await this.prisma.offer.updateMany({
      where: {
        status: OfferStatus.pending,
        validTill: { lt: now },
      },
      data: { status: OfferStatus.expired },
    });

    return { expired: result.count };
  }
}
