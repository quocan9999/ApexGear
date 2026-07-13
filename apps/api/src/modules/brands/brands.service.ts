import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { slugify } from '../../common/utils/slugify';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto, includeInactive = false) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null as null,
      ...(!includeInactive && { isActive: true }),
    };

    const [data, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.brand.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const brand = await this.prisma.brand.findFirst({
      where: { id, deletedAt: null },
    });
    if (!brand) {
      throw new NotFoundException(`Brand ${id} not found`);
    }
    return brand;
  }

  async create(dto: CreateBrandDto) {
    const slug = await this.uniqueSlug(dto.name);

    try {
      return await this.prisma.brand.create({
        data: {
          name: dto.name,
          slug,
          description: dto.description,
          logo: dto.logo,
          website: dto.website,
        },
      });
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException('Brand name or slug already exists');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateBrandDto) {
    const existing = await this.findOne(id);

    const data: Record<string, unknown> = { ...dto };
    if (dto.name && dto.name !== existing.name) {
      data.slug = await this.uniqueSlug(dto.name, id);
    }

    return this.prisma.brand.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.brand.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { products: true } } },
    });
    if (!existing) {
      throw new NotFoundException(`Brand ${id} not found`);
    }
    if (existing._count.products > 0) {
      throw new BadRequestException(
        'Cannot delete brand that has products. Reassign products first.',
      );
    }

    return this.prisma.brand.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async uniqueSlug(name: string, excludeId?: string): Promise<string> {
    let base = slugify(name);
    if (!base) base = 'brand';
    let slug = base;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.brand.findFirst({
        where: {
          slug,
          deletedAt: null,
          ...(excludeId && { NOT: { id: excludeId } }),
        },
      });
      if (!existing) return slug;
      slug = `${base}-${counter++}`;
    }
  }
}
