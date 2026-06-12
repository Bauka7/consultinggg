import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    actorId: string,
    action: AuditAction,
    target?: string,
    ip?: string,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: { actorId, action, target, ip },
      });
    } catch (e) {
      // Audit logging should never break business logic
      console.error('Audit log failed:', e);
    }
  }

  async findAll(filters?: {
    actorId?: string;
    action?: AuditAction;
    from?: Date;
    to?: Date;
    limit?: number;
    skip?: number;
  }) {
    const where: any = {};
    if (filters?.actorId) where.actorId = filters.actorId;
    if (filters?.action) where.action = filters.action;
    if (filters?.from || filters?.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = filters.from;
      if (filters.to) where.createdAt.lte = filters.to;
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { actor: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip: filters?.skip || 0,
        take: filters?.limit || 50,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total };
  }
}
