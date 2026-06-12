import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { ApplicationStatus, Role, UserStatus } from '@prisma/client';
import { UpdatePlatformSettingsDto } from './dto/platform-settings.dto';
import { ModerateApplicationDto } from './dto/moderate-application.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private emailService: EmailService,
  ) {}

  // ─── Platform Settings ──────────────────────────────────────────────────────

  async getSettings() {
    return this.prisma.platformSettings.upsert({
      where: { id: 1 },
      create: { id: 1 },
      update: {},
    });
  }

  async updateSettings(dto: UpdatePlatformSettingsDto, adminId: string) {
    const settings = await this.prisma.platformSettings.upsert({
      where: { id: 1 },
      create: { id: 1, ...dto },
      update: dto,
    });
    await this.auditService.log(adminId, 'approve', 'platform_settings:updated');
    return settings;
  }

  // ─── Dashboard ──────────────────────────────────────────────────────────────

  async getDashboardStats() {
    const [
      totalUsers,
      totalConsultants,
      totalFactories,
      totalOrders,
      pendingReviews,
      pendingApplications,
      activeOrders,
      blockedUsers,
      recentOrders,
      usersByRole,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.consultantProfile.count(),
      this.prisma.factory.count(),
      this.prisma.order.count(),
      this.prisma.review.count({ where: { status: 'pending' } }),
      this.prisma.consultantApplication.count({ where: { status: 'review' } }),
      this.prisma.order.count({ where: { status: { notIn: ['closed', 'cancelled'] } } }),
      this.prisma.user.count({ where: { status: 'blocked' } }),
      this.prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          consultant: { include: { user: { select: { name: true } } } },
          factory: { select: { id: true, name: true } },
        },
      }),
      this.prisma.user.groupBy({ by: ['role'], _count: true }),
    ]);

    return {
      totalUsers, totalConsultants, totalFactories, totalOrders,
      activeOrders, pendingReviews, pendingApplications, blockedUsers,
      usersByRole, recentOrders,
    };
  }

  // ─── Consultant Applications ─────────────────────────────────────────────────

  async getConsultantApplications(pagination: PaginationDto, status?: ApplicationStatus) {
    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.consultantApplication.findMany({
        where,
        include: { categories: { include: { category: true } } },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.consultantApplication.count({ where }),
    ]);

    return paginate(items, total, pagination);
  }

  async moderateApplication(applicationId: string, dto: ModerateApplicationDto, adminId: string) {
    const application = await this.prisma.consultantApplication.findUnique({
      where: { id: applicationId },
      include: { categories: true },
    });
    if (!application) throw new NotFoundException('Application not found');

    await this.prisma.consultantApplication.update({
      where: { id: applicationId },
      data: { status: dto.status },
    });

    await this.auditService.log(adminId, 'approve', `application:${applicationId}→${dto.status}`);

    if (dto.status === ApplicationStatus.approved || dto.status === ApplicationStatus.trial) {
      const existingUser = await this.prisma.user.findUnique({ where: { email: application.email } });

      if (!existingUser) {
        const tempPassword = Array.from({ length: 10 }, () =>
          'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'.charAt(
            Math.floor(Math.random() * 56),
          ),
        ).join('');

        const passwordHash = await bcrypt.hash(tempPassword, 12);
        const userStatus = dto.status === ApplicationStatus.trial
          ? UserStatus.trial
          : UserStatus.active;

        const user = await this.prisma.user.create({
          data: {
            email: application.email,
            passwordHash,
            role: Role.consultant,
            name: application.name,
            phone: application.phone,
            city: application.city,
            status: userStatus,
          },
        });

        const categoryIds = application.categories.map((c) => c.categoryId);
        await this.prisma.consultantProfile.create({
          data: {
            userId: user.id,
            type: 'general',
            years: application.years,
            languages: application.languages,
            trial: dto.status === ApplicationStatus.trial,
            verified: dto.status === ApplicationStatus.approved,
            categories: {
              create: categoryIds.map((categoryId) => ({ categoryId })),
            },
          },
        });

        // Send welcome email with credentials
        await this.emailService.sendConsultantApproved(application.email, application.name, tempPassword);
      }
    }

    return { message: `Application ${dto.status}`, applicationId };
  }

  // ─── User Management ────────────────────────────────────────────────────────

  async getAllUsers(pagination: PaginationDto, role?: Role, status?: string) {
    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (pagination.search) {
      where.OR = [
        { name: { contains: pagination.search, mode: 'insensitive' } },
        { email: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true, email: true, name: true, role: true, status: true,
          phone: true, city: true, createdAt: true,
          consultantProfile: { select: { id: true, rating: true, reviewsCount: true, trial: true, type: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginate(items, total, pagination);
  }

  async blockUser(targetUserId: string, adminId: string) {
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException('User not found');
    if (target.role === Role.platform_admin) {
      throw new BadRequestException('Cannot block platform admin');
    }

    const user = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { status: UserStatus.blocked },
      select: { id: true, status: true },
    });

    await this.auditService.log(adminId, 'block', `user:${targetUserId}`);
    return user;
  }

  async unblockUser(targetUserId: string, adminId: string) {
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException('User not found');

    const user = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { status: UserStatus.active },
      select: { id: true, status: true },
    });

    await this.auditService.log(adminId, 'block', `user:${targetUserId}:unblocked`);
    return user;
  }

  async setConsultantType(consultantProfileId: string, type: 'specialized' | 'general', adminId: string) {
    const profile = await this.prisma.consultantProfile.findUnique({
      where: { id: consultantProfileId },
    });
    if (!profile) throw new NotFoundException('Consultant profile not found');

    const updated = await this.prisma.consultantProfile.update({
      where: { id: consultantProfileId },
      data: { type },
    });

    await this.auditService.log(adminId, 'approve', `consultant:${consultantProfileId}:type→${type}`);
    return updated;
  }

  // ─── Factories ───────────────────────────────────────────────────────────────

  async getAllFactories(pagination: PaginationDto, verified?: boolean) {
    const where: any = {};
    if (verified !== undefined) where.verified = verified;
    if (pagination.search) {
      where.OR = [
        { name: { contains: pagination.search, mode: 'insensitive' } },
        { city: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.factory.findMany({
        where,
        include: {
          categories: { include: { category: true } },
          _count: { select: { products: true, consultants: true, orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.factory.count({ where }),
    ]);

    return paginate(items, total, pagination);
  }

  async verifyFactory(factoryId: string, adminId: string) {
    const factory = await this.prisma.factory.findUnique({ where: { id: factoryId } });
    if (!factory) throw new NotFoundException('Factory not found');

    const updated = await this.prisma.factory.update({
      where: { id: factoryId },
      data: { verified: true },
    });

    await this.auditService.log(adminId, 'verify', `factory:${factoryId}`);
    return updated;
  }

  async unverifyFactory(factoryId: string, adminId: string) {
    const factory = await this.prisma.factory.findUnique({ where: { id: factoryId } });
    if (!factory) throw new NotFoundException('Factory not found');

    const updated = await this.prisma.factory.update({
      where: { id: factoryId },
      data: { verified: false },
    });

    await this.auditService.log(adminId, 'verify', `factory:${factoryId}:unverified`);
    return updated;
  }

  // ─── Orders Oversight ────────────────────────────────────────────────────────

  async getAllOrders(pagination: PaginationDto, status?: string) {
    const where: any = {};
    if (status) where.status = status;
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
          consultant: { include: { user: { select: { id: true, name: true } } } },
          factory: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.order.count({ where }),
    ]);

    return paginate(items, total, pagination);
  }

  // ─── Consultants ─────────────────────────────────────────────────────────────

  async verifyConsultant(consultantProfileId: string, adminId: string) {
    const profile = await this.prisma.consultantProfile.findUnique({
      where: { id: consultantProfileId },
    });
    if (!profile) throw new NotFoundException('Consultant profile not found');

    const updated = await this.prisma.consultantProfile.update({
      where: { id: consultantProfileId },
      data: { verified: true },
    });
    await this.auditService.log(adminId, 'verify', `consultant:${consultantProfileId}`);
    return updated;
  }

  // ─── Factory Applications ─────────────────────────────────────────────────

  async getFactoryApplications(pagination: PaginationDto, status?: ApplicationStatus) {
    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.consultantFactoryApplication.findMany({
        where,
        include: {
          consultant: { include: { user: { select: { id: true, name: true, email: true } } } },
          factory: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.consultantFactoryApplication.count({ where }),
    ]);

    return paginate(items, total, pagination);
  }

  // ─── Reviews Moderation ──────────────────────────────────────────────────────

  async getPendingReviews(pagination: PaginationDto) {
    const where = { status: 'pending' as any };

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          author: { select: { id: true, name: true } },
          consultant: { include: { user: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.review.count({ where }),
    ]);

    return paginate(items, total, pagination);
  }

  // ─── Audit Logs ──────────────────────────────────────────────────────────────

  async getAuditLogs(pagination: PaginationDto, actorId?: string) {
    return this.auditService.findAll({
      actorId,
      limit: pagination.take,
      skip: pagination.skip,
    });
  }
}
