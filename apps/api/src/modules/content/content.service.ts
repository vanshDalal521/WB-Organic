import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  async getActiveBanners() {
    const now = new Date();
    return this.prisma.banner.findMany({
      where: {
        isActive: true,
        startAt: { lte: now },
        endAt: { gte: now },
      },
      orderBy: { priority: 'desc' },
    });
  }

  async getAllBanners(query: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = query;
    const [banners, total] = await Promise.all([
      this.prisma.banner.findMany({
        orderBy: { priority: 'desc' },
        skip: ((Number(page) || 1) - 1) * (Number(limit) || 20),
        take: Number(limit) || 20,
      }),
      this.prisma.banner.count(),
    ]);
    return { data: banners, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async createBanner(data: any) {
    return this.prisma.banner.create({
      data: {
        title: data.title,
        subtitle: data.subtitle,
        imageUrl: data.imageUrl,
        ctaLabel: data.ctaLabel,
        ctaDestination: data.ctaDestination,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        priority: data.priority || 0,
        isActive: data.isActive !== false,
        targetAudience: data.targetAudience,
      },
    });
  }

  async updateBanner(id: string, data: any) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');
    return this.prisma.banner.update({
      where: { id },
      data: {
        ...data,
        startAt: data.startAt ? new Date(data.startAt) : undefined,
        endAt: data.endAt ? new Date(data.endAt) : undefined,
      },
    });
  }

  async deleteBanner(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');
    return this.prisma.banner.delete({ where: { id } });
  }

  async getActiveFarmStories() {
    return this.prisma.farmStory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getAllFarmStories(query: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = query;
    const [stories, total] = await Promise.all([
      this.prisma.farmStory.findMany({
        orderBy: { sortOrder: 'asc' },
        skip: ((Number(page) || 1) - 1) * (Number(limit) || 20),
        take: Number(limit) || 20,
      }),
      this.prisma.farmStory.count(),
    ]);
    return { data: stories, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async createFarmStory(data: any) {
    return this.prisma.farmStory.create({
      data: {
        title: data.title,
        description: data.description,
        mediaType: data.mediaType,
        mediaUrl: data.mediaUrl,
        thumbnailUrl: data.thumbnailUrl,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive !== false,
      },
    });
  }

  async updateFarmStory(id: string, data: any) {
    const story = await this.prisma.farmStory.findUnique({ where: { id } });
    if (!story) throw new NotFoundException('Farm story not found');
    return this.prisma.farmStory.update({ where: { id }, data });
  }

  async deleteFarmStory(id: string) {
    const story = await this.prisma.farmStory.findUnique({ where: { id } });
    if (!story) throw new NotFoundException('Farm story not found');
    return this.prisma.farmStory.delete({ where: { id } });
  }

  async getAllMedia(query: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = query;
    const [media, total] = await Promise.all([
      this.prisma.media.findMany({
        orderBy: { createdAt: 'desc' },
        skip: ((Number(page) || 1) - 1) * (Number(limit) || 20),
        take: Number(limit) || 20,
      }),
      this.prisma.media.count(),
    ]);
    return { data: media, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async uploadMedia(data: any) {
    return this.prisma.media.create({
      data: {
        url: data.url,
        type: data.type,
        filename: data.filename,
        mimetype: data.mimetype,
        size: data.size,
        uploadedBy: data.uploadedBy,
      },
    });
  }
}
