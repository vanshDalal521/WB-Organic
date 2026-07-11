import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getPublicSettings() {
    const publicKeys = [
      'app_version',
      'maintenance_mode',
      'min_order_amount',
      'delivery_charge',
      'support_phone',
      'support_email',
    ];

    const settings = await this.prisma.appSetting.findMany({
      where: { key: { in: publicKeys } },
    });

    return settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, any>);
  }

  async getAllSettings(category?: string) {
    const where: Prisma.AppSettingWhereInput = {};
    if (category) {
      where.category = category;
    }

    return this.prisma.appSetting.findMany({
      where,
      orderBy: { category: 'asc' },
    });
  }

  async getSettingByKey(key: string) {
    const setting = await this.prisma.appSetting.findUnique({ where: { key } });
    if (!setting) {
      throw new NotFoundException(`Setting '${key}' not found`);
    }
    return setting;
  }

  async updateSetting(key: string, value: any, category?: string) {
    return this.prisma.appSetting.upsert({
      where: { key },
      create: {
        key,
        value,
        category: category || 'general',
      },
      update: {
        value,
        ...(category ? { category } : {}),
      },
    });
  }

  async getAuditLogs(query: {
    page?: number;
    limit?: number;
    entityType?: string;
  }) {
    const { page = 1, limit = 20, entityType } = query;

    const where: Prisma.AuditLogWhereInput = {};
    if (entityType) {
      where.entityType = entityType;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: ((Number(page) || 1) - 1) * (Number(limit) || 20),
        take: Number(limit) || 20,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
