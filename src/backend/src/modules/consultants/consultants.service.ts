import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AutoCheckResult, ApplicationStatus, Role } from '@prisma/client';
import { CreateConsultantApplicationDto } from './dto/create-application.dto';
import { UpdateConsultantProfileDto } from './dto/update-profile.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ConsultantsService {
  private readonly logger = new Logger(ConsultantsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async findAll(pagination: PaginationDto, categoryId?: string) {
    const where: any = {
      user: { status: { not: 'blocked' } },
    };

    if (categoryId) {
      where.categories = { some: { categoryId } };
    }

    if (pagination.search) {
      where.OR = [
        { user: { name: { contains: pagination.search, mode: 'insensitive' } } },
        { title: { contains: pagination.search, mode: 'insensitive' } },
        { bio: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.consultantProfile.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true, city: true, country: true, status: true },
          },
          categories: { include: { category: true } },
        },
        orderBy: [{ rating: 'desc' }, { dealsClosed: 'desc' }],
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.consultantProfile.count({ where }),
    ]);

    return paginate(items, total, pagination);
  }

  async findOne(id: string) {
    const profile = await this.prisma.consultantProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            city: true,
            country: true,
            status: true,
            createdAt: true,
          },
        },
        categories: { include: { category: true } },
        factories: {
          include: {
            factory: {
              select: { id: true, name: true, verified: true, city: true },
            },
          },
        },
      },
    });

    if (!profile) throw new NotFoundException('Consultant profile not found');
    return profile;
  }

  async findByUserId(userId: string) {
    const profile = await this.prisma.consultantProfile.findUnique({
      where: { userId },
      include: {
        categories: { include: { category: true } },
        factories: { include: { factory: true } },
      },
    });

    if (!profile) throw new NotFoundException('Consultant profile not found');
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateConsultantProfileDto) {
    const profile = await this.prisma.consultantProfile.findUnique({
      where: { userId },
    });

    if (!profile) throw new NotFoundException('Consultant profile not found');

    const { categoryIds, ...rest } = dto;

    // Handle category updates if provided
    if (categoryIds !== undefined) {
      await this.prisma.categoryOnConsultant.deleteMany({
        where: { consultantId: profile.id },
      });

      if (categoryIds.length > 0) {
        await this.prisma.categoryOnConsultant.createMany({
          data: categoryIds.map((categoryId) => ({
            consultantId: profile.id,
            categoryId,
          })),
        });
      }
    }

    return this.prisma.consultantProfile.update({
      where: { id: profile.id },
      data: rest,
      include: {
        categories: { include: { category: true } },
      },
    });
  }

  // Apply to work with a factory
  async applyToFactory(consultantUserId: string, factoryId: string, pitch?: string) {
    const profile = await this.prisma.consultantProfile.findUnique({
      where: { userId: consultantUserId },
    });

    if (!profile) throw new NotFoundException('Consultant profile not found');

    const factory = await this.prisma.factory.findUnique({ where: { id: factoryId } });
    if (!factory) throw new NotFoundException('Factory not found');

    // Check if already applied or linked
    const existing = await this.prisma.consultantFactoryApplication.findUnique({
      where: { consultantId_factoryId: { consultantId: profile.id, factoryId } },
    });

    if (existing) {
      throw new BadRequestException('Already applied or linked to this factory');
    }

    return this.prisma.consultantFactoryApplication.create({
      data: {
        consultantId: profile.id,
        factoryId,
        pitch,
        status: ApplicationStatus.review,
      },
    });
  }

  // Submit consultant application (for new applicants without account)
  async submitApplication(dto: CreateConsultantApplicationDto) {
    const autoCheck = this.runAutoCheck(dto);

    const application = await this.prisma.consultantApplication.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        city: dto.city,
        years: dto.years,
        languages: dto.languages,
        motivation: dto.motivation,
        autoCheck,
        status: ApplicationStatus.review,
        categories: dto.categoryIds
          ? {
              create: dto.categoryIds.map((categoryId) => ({ categoryId })),
            }
          : undefined,
      },
      include: { categories: { include: { category: true } } },
    });

    // Check auto-approve setting
    if (autoCheck === AutoCheckResult.pass) {
      const settings = await this.prisma.platformSettings.findUnique({ where: { id: 1 } });
      if (settings?.autoApprove) {
        await this.autoApproveApplication(application.id, dto);
      }
    }

    return application;
  }

  private runAutoCheck(dto: CreateConsultantApplicationDto): AutoCheckResult {
    const hasPhone = !!dto.phone && dto.phone.trim().length > 0;
    const hasProfile = !!(dto.name && dto.city && dto.motivation);
    const hasExperience = dto.years >= 2;
    // Simulate email verification check (in real system, would check a verification record)
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email);

    if (emailValid && hasPhone && hasProfile && hasExperience) {
      return AutoCheckResult.pass;
    }

    if (!emailValid) {
      return AutoCheckResult.fail;
    }

    return AutoCheckResult.flag;
  }

  private async autoApproveApplication(applicationId: string, dto: CreateConsultantApplicationDto) {
    // Update application to trial status
    await this.prisma.consultantApplication.update({
      where: { id: applicationId },
      data: { status: ApplicationStatus.trial },
    });

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) return; // User exists, don't create duplicate

    // Create user account with temporary password
    const tempPassword = Math.random().toString(36).slice(-10);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: Role.consultant,
        name: dto.name,
        phone: dto.phone,
        city: dto.city,
        status: 'trial' as any,
      },
    });

    await this.prisma.consultantProfile.create({
      data: {
        userId: user.id,
        type: 'general',
        years: dto.years,
        languages: dto.languages,
        trial: true,
      },
    });

    // Deliver credentials by email (never logged). Without SMTP configured,
    // EmailService logs a stub instead of leaking the password to stdout.
    await this.emailService.sendConsultantApproved(dto.email, dto.name, tempPassword);
    this.logger.log(`Auto-approved consultant account created: ${dto.email}`);
  }

  // Update consultant rating after review approval
  async recalculateRating(consultantId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { consultantId, status: 'approved' },
      select: { rating: true },
    });

    const count = reviews.length;
    const avg = count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;

    const profile = await this.prisma.consultantProfile.update({
      where: { id: consultantId },
      data: { rating: Math.round(avg * 10) / 10, reviewsCount: count },
      include: { user: { select: { id: true, status: true } } },
    });

    const settings = await this.prisma.platformSettings.findUnique({ where: { id: 1 } });
    if (!settings) return profile;

    // Apply rating thresholds
    if (avg < settings.blockThreshold && count >= 10) {
      // Block consultant if rating below block threshold after 10+ reviews
      await this.prisma.user.update({
        where: { id: profile.userId },
        data: { status: 'blocked' },
      });
      this.logger.warn(`Consultant ${consultantId} blocked: rating ${avg} < ${settings.blockThreshold}`);
    } else if (avg < settings.warnThreshold) {
      // Warning threshold — surfaced as a banner in the consultant dashboard
      this.logger.warn(`Consultant ${consultantId} below warn threshold: rating ${avg} < ${settings.warnThreshold}`);
    }

    return profile;
  }

  // Increment trial deals count after order closes
  async onOrderClosed(consultantId: string) {
    const profile = await this.prisma.consultantProfile.findUnique({
      where: { id: consultantId },
    });

    if (!profile) return;

    const settings = await this.prisma.platformSettings.findUnique({ where: { id: 1 } });
    const trialOrders = settings?.trialOrders ?? 5;
    const blockThreshold = settings?.blockThreshold ?? 3.0;

    const newTrialDeals = profile.trialDealsClosed + 1;
    const newDealsClosed = profile.dealsClosed + 1;

    const updateData: any = {
      trialDealsClosed: newTrialDeals,
      dealsClosed: newDealsClosed,
    };

    // Graduate from trial if closed enough deals and rating is acceptable
    if (profile.trial && newTrialDeals >= trialOrders && profile.rating >= blockThreshold) {
      updateData.trial = false;
      this.logger.log(`Consultant ${consultantId} graduated from trial`);
    }

    return this.prisma.consultantProfile.update({
      where: { id: consultantId },
      data: updateData,
    });
  }

  async getConsultantReviews(consultantId: string, pagination: PaginationDto) {
    const where = { consultantId, status: 'approved' as any };

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.review.count({ where }),
    ]);

    return paginate(items, total, pagination);
  }
}
