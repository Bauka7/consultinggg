import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Role, ReviewStatus } from '@prisma/client';
import { CreateReviewDto } from './dto/create-review.dto';
import { ConsultantsService } from '../consultants/consultants.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

// Suspicious patterns in review text
const SPAM_PATTERNS = [
  /\b(http|https|www)\S+/i, // URLs
  /\+?\d[\d\s\-().]{7,}\d/,  // Phone numbers
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // Emails
  /telegram|whatsapp|wechat|viber|signal/i, // Messenger apps
  /купить|продать|скидка|акция/i, // Russian spam words
];

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private consultantsService: ConsultantsService,
  ) {}

  async create(authorId: string, dto: CreateReviewDto) {
    // Validate consultant exists
    const consultant = await this.prisma.consultantProfile.findUnique({
      where: { id: dto.consultantId },
    });
    if (!consultant) throw new NotFoundException('Consultant not found');

    // Client cannot review their own assigned consultant without a completed order
    if (dto.orderId) {
      const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
      if (!order) throw new NotFoundException('Order not found');
      if (order.clientId !== authorId) {
        throw new ForbiddenException('You can only review from your own orders');
      }
      if (order.consultantId !== dto.consultantId) {
        throw new BadRequestException('Consultant does not match this order');
      }
    }

    // Check for duplicate review (one per client per consultant)
    const existingReview = await this.prisma.review.findFirst({
      where: { authorId, consultantId: dto.consultantId },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this consultant');
    }

    // Auto-flag suspicious content
    const autoFlag = this.checkSuspicious(dto.text);

    const review = await this.prisma.review.create({
      data: {
        authorId,
        consultantId: dto.consultantId,
        orderId: dto.orderId,
        rating: dto.rating,
        text: dto.text,
        status: ReviewStatus.pending,
        autoFlag: autoFlag || null,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        consultant: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    return review;
  }

  private checkSuspicious(text: string): string | null {
    for (const pattern of SPAM_PATTERNS) {
      if (pattern.test(text)) {
        return `Matched pattern: ${pattern.source}`;
      }
    }

    // Check for very short reviews (likely spam)
    if (text.trim().length < 10) {
      return 'Review too short';
    }

    // Check for excessive repetition
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    if (words.length > 5 && uniqueWords.size / words.length < 0.3) {
      return 'Excessive word repetition';
    }

    return null;
  }

  async approve(reviewId: string, adminId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    if (review.status === ReviewStatus.approved) {
      throw new BadRequestException('Review is already approved');
    }

    await this.prisma.review.update({
      where: { id: reviewId },
      data: { status: ReviewStatus.approved },
    });

    // Business rule #5: Reviews published only after admin approval
    // After approval, recalculate consultant rating and apply thresholds
    await this.consultantsService.recalculateRating(review.consultantId);

    return { message: 'Review approved and rating recalculated' };
  }

  async remove(reviewId: string, adminId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    const wasApproved = review.status === ReviewStatus.approved;

    await this.prisma.review.update({
      where: { id: reviewId },
      data: { status: ReviewStatus.removed },
    });

    // If we removed an approved review, recalculate rating
    if (wasApproved) {
      await this.consultantsService.recalculateRating(review.consultantId);
    }

    return { message: 'Review removed' };
  }

  async findAll(pagination: PaginationDto, status?: ReviewStatus, consultantId?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (consultantId) where.consultantId = consultantId;

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          consultant: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.review.count({ where }),
    ]);

    return paginate(items, total, pagination);
  }

  async findPending(pagination: PaginationDto) {
    return this.findAll(pagination, ReviewStatus.pending);
  }

  async findFlagged(pagination: PaginationDto) {
    const where: any = {
      autoFlag: { not: null },
      status: ReviewStatus.pending,
    };

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          consultant: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.review.count({ where }),
    ]);

    return paginate(items, total, pagination);
  }

  async findByConsultant(consultantId: string, pagination: PaginationDto, isAdmin: boolean) {
    const where: any = { consultantId };
    if (!isAdmin) where.status = ReviewStatus.approved;

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
