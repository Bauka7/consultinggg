import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { factories: true, consultants: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        factories: {
          include: {
            factory: {
              select: { id: true, name: true, verified: true, city: true, province: true },
            },
          },
          take: 10,
        },
        consultants: {
          include: {
            consultant: {
              select: {
                id: true,
                rating: true,
                user: { select: { id: true, name: true, avatarUrl: true } },
              },
            },
          },
          take: 10,
        },
        _count: {
          select: { factories: true, consultants: true },
        },
      },
    });

    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(data: {
    id: string;
    name: string;
    slug: string;
    icon?: string;
    hue?: number;
    blurb?: string;
  }) {
    return this.prisma.category.create({ data });
  }

  async update(
    id: string,
    data: { name?: string; slug?: string; icon?: string; hue?: number; blurb?: string },
  ) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    return this.prisma.category.update({ where: { id }, data });
  }

  async delete(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    await this.prisma.category.delete({ where: { id } });
    return { message: 'Category deleted' };
  }
}
