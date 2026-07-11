import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    page?: string | number;
    limit?: string | number;
    search?: string;
    categoryId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    isFeatured?: string | boolean;
    isTrending?: string | boolean;
  }) {
    const page = Math.max(1, parseInt(String(query.page || 1), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || 20), 10) || 20));
    const { search, categoryId, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const isFeatured = query.isFeatured === 'true' || query.isFeatured === true ? true : undefined;
    const isTrending = query.isTrending === 'true' || query.isTrending === true ? true : undefined;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    if (isTrending !== undefined) {
      where.isTrending = isTrending;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          variants: {
            where: { isActive: true },
            orderBy: { price: 'asc' },
          },
          images: {
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: ((Number(page) || 1) - 1) * (Number(limit) || 20),
        take: Number(limit) || 20,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(idOrSlug: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        isActive: true,
      },
      include: {
        category: true,
        variants: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findByCategory(categorySlug: string, query: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = query;

    const category = await this.prisma.category.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          categoryId: category.id,
          isActive: true,
        },
        include: {
          category: true,
          variants: {
            where: { isActive: true },
            orderBy: { price: 'asc' },
          },
          images: {
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: ((Number(page) || 1) - 1) * (Number(limit) || 20),
        take: Number(limit) || 20,
      }),
      this.prisma.product.count({
        where: {
          categoryId: category.id,
          isActive: true,
        },
      }),
    ]);

    return {
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCategories() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getFeaturedProducts() {
    return this.prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: true,
      },
      include: {
        variants: {
          where: { isActive: true },
          take: 1,
          orderBy: { price: 'asc' },
        },
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
      take: 10,
    });
  }

  async getTrendingProducts() {
    return this.prisma.product.findMany({
      where: {
        isActive: true,
        isTrending: true,
      },
      include: {
        variants: {
          where: { isActive: true },
          take: 1,
          orderBy: { price: 'asc' },
        },
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
      take: 10,
    });
  }

  async createProduct(data: Prisma.ProductCreateInput) {
    const existingSlug = await this.prisma.product.findUnique({
      where: { slug: data.slug },
    });

    if (existingSlug) {
      throw new BadRequestException('Product with this slug already exists');
    }

    return this.prisma.product.create({
      data,
      include: {
        category: true,
        variants: true,
        images: true,
      },
    });
  }

  async updateProduct(id: string, data: Prisma.ProductUpdateInput) {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
        variants: true,
        images: true,
      },
    });
  }

  async toggleProductStatus(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive },
    });
  }
}
