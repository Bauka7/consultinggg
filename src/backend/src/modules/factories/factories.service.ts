import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Role } from '@prisma/client';
import { CreateFactoryDto } from './dto/create-factory.dto';
import { UpdateFactoryDto } from './dto/update-factory.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class FactoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto, categoryId?: string, province?: string) {
    const where: any = {};

    if (categoryId) {
      where.categories = { some: { categoryId } };
    }

    if (province) {
      where.province = { contains: province, mode: 'insensitive' };
    }

    if (pagination.search) {
      where.OR = [
        { name: { contains: pagination.search, mode: 'insensitive' } },
        { nameCn: { contains: pagination.search, mode: 'insensitive' } },
        { city: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.factory.findMany({
        where,
        include: {
          categories: { include: { category: true } },
          certs: { select: { id: true, name: true, status: true } },
          _count: { select: { products: true, consultants: true } },
        },
        orderBy: [{ verified: 'desc' }, { createdAt: 'desc' }],
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.factory.count({ where }),
    ]);

    return paginate(items, total, pagination);
  }

  // Factory owned by the current factory_admin (all products + certs, not just active)
  async findMyFactory(userId: string) {
    const factory = await this.prisma.factory.findUnique({
      where: { ownerUserId: userId },
      include: {
        categories: { include: { category: true } },
        products: true,
        certs: true,
        consultants: {
          include: {
            consultant: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
          },
        },
        _count: { select: { orders: true } },
      },
    });
    if (!factory) throw new NotFoundException('You do not own a factory');
    return factory;
  }

  async updateMyFactory(userId: string, dto: UpdateFactoryDto) {
    const factory = await this.prisma.factory.findUnique({ where: { ownerUserId: userId } });
    if (!factory) throw new NotFoundException('You do not own a factory');
    return this.update(factory.id, dto, userId, Role.factory_admin);
  }

  async findOne(id: string) {
    const factory = await this.prisma.factory.findUnique({
      where: { id },
      include: {
        categories: { include: { category: true } },
        products: { where: { active: true } },
        certs: true,
        consultants: {
          include: {
            consultant: {
              include: {
                user: { select: { id: true, name: true, avatarUrl: true } },
              },
            },
          },
        },
        _count: { select: { orders: true } },
      },
    });

    if (!factory) throw new NotFoundException('Factory not found');
    return factory;
  }

  // Admin creates the factory WITHOUT an owner. A factory_admin becomes the
  // owner later by registering through a factory invite (auth.registerWithInvite).
  async create(dto: CreateFactoryDto) {
    const { categoryIds, ...rest } = dto;

    const factory = await this.prisma.factory.create({
      data: {
        ...rest,
        photoUrls: rest.photoUrls || [],
        categories: categoryIds
          ? {
              create: categoryIds.map((categoryId) => ({ categoryId })),
            }
          : undefined,
      },
      include: {
        categories: { include: { category: true } },
      },
    });

    // Update category factory counts
    if (categoryIds?.length) {
      await this.prisma.$transaction(
        categoryIds.map((categoryId) =>
          this.prisma.category.update({
            where: { id: categoryId },
            data: { factoryCount: { increment: 1 } },
          }),
        ),
      );
    }

    return factory;
  }

  async update(id: string, dto: UpdateFactoryDto, userId: string, userRole: Role) {
    const factory = await this.prisma.factory.findUnique({ where: { id } });
    if (!factory) throw new NotFoundException('Factory not found');

    // Only platform_admin or the factory owner can update
    if (userRole !== Role.platform_admin && factory.ownerUserId !== userId) {
      throw new ForbiddenException('No permission to update this factory');
    }

    const { categoryIds, ...rest } = dto;

    if (categoryIds !== undefined) {
      // Get old category IDs
      const oldLinks = await this.prisma.categoryOnFactory.findMany({ where: { factoryId: id } });
      const oldCategoryIds = oldLinks.map((l) => l.categoryId);

      await this.prisma.categoryOnFactory.deleteMany({ where: { factoryId: id } });

      if (categoryIds.length > 0) {
        await this.prisma.categoryOnFactory.createMany({
          data: categoryIds.map((categoryId) => ({ factoryId: id, categoryId })),
        });
      }

      // Decrement old, increment new
      const removed = oldCategoryIds.filter((c) => !categoryIds.includes(c));
      const added = categoryIds.filter((c) => !oldCategoryIds.includes(c));

      await this.prisma.$transaction([
        ...removed.map((categoryId) =>
          this.prisma.category.update({
            where: { id: categoryId },
            data: { factoryCount: { decrement: 1 } },
          }),
        ),
        ...added.map((categoryId) =>
          this.prisma.category.update({
            where: { id: categoryId },
            data: { factoryCount: { increment: 1 } },
          }),
        ),
      ]);
    }

    return this.prisma.factory.update({
      where: { id },
      data: rest,
      include: { categories: { include: { category: true } } },
    });
  }

  async verify(id: string) {
    const factory = await this.prisma.factory.findUnique({ where: { id } });
    if (!factory) throw new NotFoundException('Factory not found');

    return this.prisma.factory.update({
      where: { id },
      data: { verified: true },
    });
  }

  async findConsultantByCategory(categoryId: string): Promise<{ id: string; userId: string } | null> {
    // Try to find a specialist consultant for this category
    const specialist = await this.prisma.consultantProfile.findFirst({
      where: {
        type: 'specialized',
        trial: false,
        categories: { some: { categoryId } },
        user: { status: 'active' },
      },
      orderBy: { rating: 'desc' },
    });

    if (specialist) return specialist;

    // Fall back to general consultant
    const settings = await this.prisma.platformSettings.findUnique({ where: { id: 1 } });

    if (settings?.assignRule === 'load') {
      // Find general consultant with fewest active orders
      const generals = await this.prisma.consultantProfile.findMany({
        where: {
          type: 'general',
          trial: false,
          user: { status: 'active' },
        },
        include: {
          _count: {
            select: {
              orders: {
                where: {
                  status: {
                    notIn: ['closed', 'cancelled'],
                  },
                },
              },
            },
          },
        },
      });

      if (generals.length === 0) return null;

      generals.sort((a, b) => (a as any)._count.orders - (b as any)._count.orders);
      return generals[0];
    } else {
      // Round-robin: pick next consultant by last assigned
      const general = await this.prisma.consultantProfile.findFirst({
        where: {
          type: 'general',
          trial: false,
          user: { status: 'active' },
        },
        orderBy: { dealsClosed: 'asc' },
      });

      return general || null;
    }
  }

  async getFactoryApplications(factoryId: string, userId: string, userRole: Role) {
    const factory = await this.prisma.factory.findUnique({ where: { id: factoryId } });
    if (!factory) throw new NotFoundException('Factory not found');

    if (userRole !== Role.platform_admin && factory.ownerUserId !== userId) {
      throw new ForbiddenException('No permission to view applications for this factory');
    }

    return this.prisma.consultantFactoryApplication.findMany({
      where: { factoryId },
      include: {
        consultant: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            categories: { include: { category: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveConsultantApplication(
    applicationId: string,
    factoryId: string,
    userId: string,
    userRole: Role,
  ) {
    const factory = await this.prisma.factory.findUnique({ where: { id: factoryId } });
    if (!factory) throw new NotFoundException('Factory not found');

    if (userRole !== Role.platform_admin && factory.ownerUserId !== userId) {
      throw new ForbiddenException('No permission');
    }

    const application = await this.prisma.consultantFactoryApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) throw new NotFoundException('Application not found');

    // Create the link
    await this.prisma.consultantFactoryLink.create({
      data: {
        consultantId: application.consultantId,
        factoryId: application.factoryId,
      },
    });

    return this.prisma.consultantFactoryApplication.update({
      where: { id: applicationId },
      data: { status: 'approved' },
    });
  }

  async rejectConsultantApplication(applicationId: string, userId: string, userRole: Role) {
    const application = await this.prisma.consultantFactoryApplication.findUnique({
      where: { id: applicationId },
      include: { factory: true },
    });

    if (!application) throw new NotFoundException('Application not found');

    if (userRole !== Role.platform_admin && application.factory.ownerUserId !== userId) {
      throw new ForbiddenException('No permission');
    }

    return this.prisma.consultantFactoryApplication.update({
      where: { id: applicationId },
      data: { status: 'rejected' },
    });
  }
}
