import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Role, RequestStatus } from '@prisma/client';
import { CreateRequestDto } from './dto/create-request.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { FactoriesService } from '../factories/factories.service';

@Injectable()
export class RequestsService {
  constructor(
    private prisma: PrismaService,
    private factoriesService: FactoriesService,
  ) {}

  async create(clientId: string, dto: CreateRequestDto) {
    // Validate category exists
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');

    // Auto-assign consultant based on platform settings
    let consultantId: string | null = null;

    const settings = await this.prisma.platformSettings.findUnique({ where: { id: 1 } });

    if (settings?.autoAssign) {
      const consultant = await this.factoriesService.findConsultantByCategory(dto.categoryId);
      if (consultant) {
        consultantId = consultant.id;
      }
    }

    const request = await this.prisma.request.create({
      data: {
        clientId,
        categoryId: dto.categoryId,
        product: dto.product,
        qty: dto.qty,
        unit: dto.unit,
        requirements: dto.requirements,
        deadline: dto.deadline,
        budgetHint: dto.budgetHint,
        // Submitted + assigned to a consultant → "в работе"; otherwise awaiting assignment
        status: consultantId ? RequestStatus.work : RequestStatus.draft,
        consultantId,
      },
      include: {
        category: true,
        consultant: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });

    // Create client thread for this request
    await this.prisma.thread.create({
      data: {
        kind: 'client',
        clientId,
        consultantId,
        requestId: request.id,
      },
    });

    return request;
  }

  async findAll(userId: string, userRole: Role, pagination: PaginationDto, status?: RequestStatus) {
    const where: any = {};

    if (status) where.status = status;

    if (userRole === Role.client) {
      where.clientId = userId;
    } else if (userRole === Role.consultant) {
      // Consultant sees their assigned requests
      const profile = await this.prisma.consultantProfile.findUnique({
        where: { userId },
      });
      if (!profile) return paginate([], 0, pagination);
      where.consultantId = profile.id;
    }
    // platform_admin sees all

    if (pagination.search) {
      where.product = { contains: pagination.search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.request.findMany({
        where,
        include: {
          category: true,
          client: { select: { id: true, name: true, avatarUrl: true } },
          consultant: {
            include: {
              user: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
          _count: { select: { offers: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.request.count({ where }),
    ]);

    return paginate(items, total, pagination);
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const request = await this.prisma.request.findUnique({
      where: { id },
      include: {
        category: true,
        client: { select: { id: true, name: true, email: true, avatarUrl: true } },
        consultant: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        offers: {
          where: userRole === Role.client ? { status: { not: 'expired' } } : {},
        },
        threads: {
          select: { id: true, kind: true },
        },
      },
    });

    if (!request) throw new NotFoundException('Request not found');

    // Access control
    if (userRole === Role.client && request.clientId !== userId) {
      throw new ForbiddenException('Cannot access this request');
    }

    if (userRole === Role.consultant) {
      const profile = await this.prisma.consultantProfile.findUnique({ where: { userId } });
      if (!profile || request.consultantId !== profile.id) {
        throw new ForbiddenException('Cannot access this request');
      }
    }

    return request;
  }

  async assignConsultant(requestId: string, consultantId: string, adminId: string) {
    const request = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');

    const consultant = await this.prisma.consultantProfile.findUnique({
      where: { id: consultantId },
    });
    if (!consultant) throw new NotFoundException('Consultant not found');

    const updated = await this.prisma.request.update({
      where: { id: requestId },
      data: { consultantId, status: RequestStatus.work },
    });

    // Update thread consultant
    await this.prisma.thread.updateMany({
      where: { requestId },
      data: { consultantId },
    });

    return updated;
  }

  async updateStatus(
    requestId: string,
    status: RequestStatus,
    userId: string,
    userRole: Role,
  ) {
    const request = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');

    if (userRole === Role.client && request.clientId !== userId) {
      throw new ForbiddenException('No permission');
    }

    if (userRole === Role.consultant) {
      const profile = await this.prisma.consultantProfile.findUnique({ where: { userId } });
      if (!profile || request.consultantId !== profile.id) {
        throw new ForbiddenException('No permission');
      }
    }

    return this.prisma.request.update({
      where: { id: requestId },
      data: { status },
    });
  }

  async decline(requestId: string, clientId: string) {
    const request = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.clientId !== clientId) throw new ForbiddenException('No permission');

    return this.prisma.request.update({
      where: { id: requestId },
      data: { status: RequestStatus.declined },
    });
  }
}
