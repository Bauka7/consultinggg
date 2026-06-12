import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Role, InviteStatus, InviteRole } from '@prisma/client';
import { CreateInviteDto } from './dto/create-invite.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EmailService } from '../email/email.service';

const INVITE_TTL_HOURS = 48;

@Injectable()
export class InvitesService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    @InjectQueue('invites') private invitesQueue: Queue,
  ) {}

  async create(creatorId: string, creatorRole: Role, dto: CreateInviteDto) {
    const creator = await this.prisma.user.findUnique({
      where: { id: creatorId },
      select: { name: true },
    });

    // factory_admin can only invite consultants to their own factory
    if (creatorRole === Role.factory_admin) {
      if (dto.role !== InviteRole.consultant) {
        throw new ForbiddenException('Factory admins can only invite consultants');
      }
      const factory = await this.prisma.factory.findUnique({
        where: { ownerUserId: creatorId },
      });
      if (!factory) throw new NotFoundException('You do not own a factory');
      dto.factoryId = factory.id;
    }

    if (dto.factoryId) {
      const factory = await this.prisma.factory.findUnique({ where: { id: dto.factoryId } });
      if (!factory) throw new NotFoundException('Factory not found');
    }

    // Prevent duplicate active invites
    const existing = await this.prisma.invite.findFirst({
      where: { email: dto.email, status: InviteStatus.pending, expiresAt: { gt: new Date() } },
    });
    if (existing) {
      throw new BadRequestException('An active invite already exists for this email');
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + INVITE_TTL_HOURS);

    const invite = await this.prisma.invite.create({
      data: {
        role: dto.role,
        email: dto.email,
        createdById: creatorId,
        factoryId: dto.factoryId,
        status: InviteStatus.pending,
        expiresAt,
      },
      include: { factory: { select: { name: true } } },
    });

    // Schedule BullMQ expiry job
    await this.invitesQueue.add(
      'expire-invite',
      { inviteId: invite.id },
      { delay: INVITE_TTL_HOURS * 60 * 60 * 1000 },
    );

    // Send invite email
    await this.emailService.sendInvite(
      dto.email,
      invite.token,
      dto.role,
      creator?.name || 'Tradewind',
      (invite.factory as any)?.name,
    );

    return invite;
  }

  async validate(token: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { token },
      include: {
        factory: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!invite) throw new NotFoundException('Invite not found');

    if (invite.status !== InviteStatus.pending) {
      throw new BadRequestException(`Invite is ${invite.status}`);
    }

    if (invite.expiresAt < new Date()) {
      await this.prisma.invite.update({
        where: { id: invite.id },
        data: { status: InviteStatus.expired },
      });
      throw new BadRequestException('Invite has expired');
    }

    return {
      valid: true,
      email: invite.email,
      role: invite.role,
      factory: invite.factory,
      inviter: invite.createdBy,
      expiresAt: invite.expiresAt,
    };
  }

  async findAll(creatorId?: string, userRole?: Role) {
    const where: any = {};
    if (userRole === Role.factory_admin && creatorId) {
      where.createdById = creatorId;
    }

    return this.prisma.invite.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        factory: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(inviteId: string, userId: string, userRole: Role) {
    const invite = await this.prisma.invite.findUnique({ where: { id: inviteId } });
    if (!invite) throw new NotFoundException('Invite not found');

    if (userRole !== Role.platform_admin && invite.createdById !== userId) {
      throw new ForbiddenException('Cannot revoke this invite');
    }
    if (invite.status !== InviteStatus.pending) {
      throw new BadRequestException('Only pending invites can be revoked');
    }

    return this.prisma.invite.update({
      where: { id: inviteId },
      data: { status: InviteStatus.expired },
    });
  }

  async expireOutdatedInvites() {
    const result = await this.prisma.invite.updateMany({
      where: { status: InviteStatus.pending, expiresAt: { lt: new Date() } },
      data: { status: InviteStatus.expired },
    });
    return { expired: result.count };
  }
}
