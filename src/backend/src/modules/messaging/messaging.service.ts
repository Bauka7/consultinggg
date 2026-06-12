import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Role, ThreadKind } from '@prisma/client';
import { CreateMessageDto, CreateThreadDto } from './dto/create-message.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) {}

  async getThreads(userId: string, userRole: Role) {
    const where: any = {};

    if (userRole === Role.client) {
      // Business rule: client never sees factory threads
      where.kind = { not: ThreadKind.factory };
      where.clientId = userId;
    } else if (userRole === Role.consultant) {
      const profile = await this.prisma.consultantProfile.findUnique({ where: { userId } });
      if (!profile) return [];
      where.consultantId = profile.id;
    } else if (userRole === Role.factory_admin) {
      const factory = await this.prisma.factory.findUnique({ where: { ownerUserId: userId } });
      if (!factory) return [];
      where.factoryId = factory.id;
      where.kind = ThreadKind.factory;
    }
    // platform_admin sees all threads

    const threads = await this.prisma.thread.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        _count: {
          select: {
            messages: { where: { readAt: null, senderId: { not: userId } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich each thread with a display-ready counterpart (title + subtitle),
    // computed from the viewer's role so the UI never shows a generic "Клиент".
    const clientIds = [...new Set(threads.map((t) => t.clientId).filter(Boolean))] as string[];
    const factoryIds = [...new Set(threads.map((t) => t.factoryId).filter(Boolean))] as string[];
    const consultantIds = [...new Set(threads.map((t) => t.consultantId).filter(Boolean))] as string[];

    const [clients, factories, consultants] = await Promise.all([
      this.prisma.user.findMany({ where: { id: { in: clientIds } }, select: { id: true, name: true, avatarUrl: true } }),
      this.prisma.factory.findMany({ where: { id: { in: factoryIds } }, select: { id: true, name: true } }),
      this.prisma.consultantProfile.findMany({ where: { id: { in: consultantIds } }, select: { id: true, user: { select: { name: true, avatarUrl: true } } } }),
    ]);

    const clientMap = new Map(clients.map((c) => [c.id, c]));
    const factoryMap = new Map(factories.map((f) => [f.id, f]));
    const consultantMap = new Map(consultants.map((c) => [c.id, c]));

    return threads.map((t) => {
      let title = 'Чат';
      let subtitle = '';

      if (t.kind === ThreadKind.support) {
        title = 'Поддержка Tradewind';
        subtitle = 'Поддержка';
      } else if (userRole === Role.client) {
        // client only has client-kind threads → counterpart is the consultant
        const c = t.consultantId ? consultantMap.get(t.consultantId) : null;
        title = c?.user?.name || 'Консультант';
        subtitle = 'Консультант';
      } else if (userRole === Role.factory_admin) {
        // factory only sees factory-kind threads → counterpart is the consultant
        const c = t.consultantId ? consultantMap.get(t.consultantId) : null;
        title = c?.user?.name || 'Консультант';
        subtitle = 'Консультант';
      } else {
        // consultant (and admin) view
        if (t.kind === ThreadKind.factory) {
          const f = t.factoryId ? factoryMap.get(t.factoryId) : null;
          title = f?.name || 'Завод';
          subtitle = 'Завод · скрытая линия';
        } else {
          const cl = t.clientId ? clientMap.get(t.clientId) : null;
          title = cl?.name || 'Клиент';
          subtitle = 'Клиент';
        }
      }

      return { ...t, title, subtitle };
    });
  }

  async getThread(threadId: string, userId: string, userRole: Role) {
    const thread = await this.prisma.thread.findUnique({ where: { id: threadId } });
    if (!thread) throw new NotFoundException('Thread not found');
    await this.assertThreadAccess(thread, userId, userRole);
    return thread;
  }

  async createThread(dto: CreateThreadDto, creatorId: string, creatorRole: Role) {
    if (dto.kind === 'factory' && creatorRole === Role.client) {
      throw new ForbiddenException('Clients cannot create factory threads');
    }

    return this.prisma.thread.create({
      data: {
        kind: dto.kind as ThreadKind,
        requestId: dto.requestId,
        orderId: dto.orderId,
        clientId: dto.clientId,
        consultantId: dto.consultantId,
        factoryId: dto.factoryId,
      },
    });
  }

  async getMessages(threadId: string, userId: string, userRole: Role, pagination: PaginationDto) {
    const thread = await this.prisma.thread.findUnique({ where: { id: threadId } });
    if (!thread) throw new NotFoundException('Thread not found');
    await this.assertThreadAccess(thread, userId, userRole);

    const [items, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { threadId },
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.message.count({ where: { threadId } }),
    ]);

    // Mark messages from other senders as read
    await this.prisma.message.updateMany({
      where: { threadId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });

    return paginate(items, total, pagination);
  }

  async sendMessage(dto: CreateMessageDto, senderId: string, senderRole: Role) {
    const thread = await this.prisma.thread.findUnique({ where: { id: dto.threadId } });
    if (!thread) throw new NotFoundException('Thread not found');
    await this.assertThreadAccess(thread, senderId, senderRole);

    return this.prisma.message.create({
      data: {
        threadId: dto.threadId,
        senderId,
        body: dto.body,
        attachmentUrl: dto.attachmentUrl,
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true, role: true } },
        thread: { select: { id: true, kind: true, clientId: true, consultantId: true } },
      },
    });
  }

  async markRead(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId === userId) return message;

    return this.prisma.message.update({
      where: { id: messageId },
      data: { readAt: new Date() },
    });
  }

  async getUnreadCount(userId: string, userRole: Role) {
    const threadWhere: any = {};

    if (userRole === Role.client) {
      threadWhere.clientId = userId;
      threadWhere.kind = { not: ThreadKind.factory };
    } else if (userRole === Role.consultant) {
      const profile = await this.prisma.consultantProfile.findUnique({ where: { userId } });
      if (!profile) return { unread: 0 };
      threadWhere.consultantId = profile.id;
    } else if (userRole === Role.factory_admin) {
      const factory = await this.prisma.factory.findUnique({ where: { ownerUserId: userId } });
      if (!factory) return { unread: 0 };
      threadWhere.factoryId = factory.id;
    }

    const threads = await this.prisma.thread.findMany({
      where: threadWhere,
      select: { id: true },
    });

    if (threads.length === 0) return { unread: 0 };

    const unread = await this.prisma.message.count({
      where: {
        threadId: { in: threads.map((t) => t.id) },
        senderId: { not: userId },
        readAt: null,
      },
    });

    return { unread };
  }

  // Fully async access check enforcing all business rules
  private async assertThreadAccess(thread: any, userId: string, userRole: Role) {
    if (userRole === Role.platform_admin) return;

    // Clients never access factory threads (business rule #3)
    if (userRole === Role.client) {
      if (thread.kind === ThreadKind.factory) {
        throw new ForbiddenException('Clients cannot access factory threads');
      }
      if (thread.clientId !== userId) {
        throw new ForbiddenException('No access to this thread');
      }
      return;
    }

    if (userRole === Role.consultant) {
      const profile = await this.prisma.consultantProfile.findUnique({ where: { userId } });
      if (!profile) throw new ForbiddenException('Consultant profile not found');
      // Thread must be linked to this consultant
      if (thread.consultantId !== profile.id) {
        throw new ForbiddenException('No access to this thread');
      }
      return;
    }

    if (userRole === Role.factory_admin) {
      if (thread.kind !== ThreadKind.factory) {
        throw new ForbiddenException('Factory admins can only access factory threads');
      }
      const factory = await this.prisma.factory.findUnique({ where: { ownerUserId: userId } });
      if (!factory || thread.factoryId !== factory.id) {
        throw new ForbiddenException('No access to this thread');
      }
    }
  }
}
