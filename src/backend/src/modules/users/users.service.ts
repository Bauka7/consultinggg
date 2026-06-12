import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto, role?: Role) {
    const where: any = {};
    if (role) where.role = role;
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
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          phone: true,
          city: true,
          country: true,
          avatarUrl: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginate(items, total, pagination);
  }

  async findOne(id: string, requestingRole?: Role, requestingUserId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        phone: true,
        city: true,
        country: true,
        avatarUrl: true,
        createdAt: true,
        consultantProfile: {
          include: {
            categories: { include: { category: true } },
            factories: { include: { factory: { select: { id: true, name: true, verified: true } } } },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        phone: true,
        city: true,
        country: true,
        avatarUrl: true,
        createdAt: true,
        consultantProfile: {
          include: {
            categories: { include: { category: true } },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateMe(
    userId: string,
    data: {
      name?: string;
      phone?: string;
      city?: string;
      country?: string;
      avatarUrl?: string;
    },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        phone: true,
        city: true,
        country: true,
        avatarUrl: true,
        updatedAt: true,
      },
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new ForbiddenException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Password updated successfully' };
  }

  async blockUser(adminId: string, targetUserId: string) {
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException('User not found');
    if (target.role === Role.platform_admin) {
      throw new ForbiddenException('Cannot block platform admin');
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { status: 'blocked' },
      select: { id: true, status: true },
    });
  }

  async unblockUser(adminId: string, targetUserId: string) {
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { status: 'active' },
      select: { id: true, status: true },
    });
  }

  async deleteUser(adminId: string, targetUserId: string) {
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException('User not found');
    if (target.role === Role.platform_admin) {
      throw new ForbiddenException('Cannot delete platform admin');
    }

    await this.prisma.user.delete({ where: { id: targetUserId } });
    return { message: 'User deleted' };
  }
}
