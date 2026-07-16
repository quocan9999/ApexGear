import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { slugify } from '../../common/utils/slugify';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryCategoryDto, isStaff = false) {
    const where: {
      deletedAt: null;
      isActive?: boolean;
      parentId: null;
    } = {
      deletedAt: null,
      parentId: null,
    };

    if (!isStaff || !query.includeInactive) {
      where.isActive = true;
    }

    const parents = await this.prisma.category.findMany({
      where,
      include: {
        children: {
          where: {
            deletedAt: null,
            ...((!isStaff || !query.includeInactive) && { isActive: true }),
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return parents;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findFirst({
      where: { slug, deletedAt: null },
      include: {
        children: {
          where: { deletedAt: null, isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        parent: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }

    return category;
  }

  async create(dto: CreateCategoryDto) {
    if (dto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, deletedAt: null },
      });
      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }
      // Only top-level categories can be parents (no grandchildren)
      if (parent.parentId) {
        throw new BadRequestException(
          'Cannot nest under a subcategory — only 2 levels allowed',
        );
      }
    }

    const slug = await this.uniqueSlug(dto.name);

    return await this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        image: dto.image,
        parentId: dto.parentId,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException(`Category ${id} not found`);
    }

    if (dto.parentId !== undefined && dto.parentId !== null) {
      if (dto.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, deletedAt: null },
      });
      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }
      if (parent.parentId) {
        throw new BadRequestException(
          'Cannot nest under a subcategory — only 2 levels allowed',
        );
      }
    }

    const data: Record<string, unknown> = { ...dto };
    if (dto.name && dto.name !== existing.name) {
      data.slug = await this.uniqueSlug(dto.name, id);
    }

    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { products: true, children: true } } },
    });
    if (!existing) {
      throw new NotFoundException(`Category ${id} not found`);
    }

    if (existing._count.products > 0) {
      throw new BadRequestException(
        'Cannot delete category that has products. Move or delete products first.',
      );
    }

    // Soft-delete children too
    await this.prisma.category.updateMany({
      where: { parentId: id, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async uniqueSlug(name: string, excludeId?: string): Promise<string> {
    let base = slugify(name);
    if (!base) base = 'category';
    let slug = base;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.category.findFirst({
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
