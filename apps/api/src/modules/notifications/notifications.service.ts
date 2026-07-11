import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getNotifications(customerId: string, query: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }) {
    const { page = 1, limit = 20, unreadOnly } = query;

    const where: Prisma.NotificationRecipientWhereInput = { customerId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notificationRecipient.findMany({
        where,
        include: { notification: true },
        orderBy: { createdAt: 'desc' },
        skip: ((Number(page) || 1) - 1) * (Number(limit) || 20),
        take: Number(limit) || 20,
      }),
      this.prisma.notificationRecipient.count({ where }),
    ]);

    return {
      data: notifications,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUnreadCount(customerId: string) {
    const count = await this.prisma.notificationRecipient.count({
      where: { customerId, isRead: false },
    });
    return { count };
  }

  async markAsRead(notificationId: string, customerId: string) {
    const recipient = await this.prisma.notificationRecipient.findFirst({
      where: { id: notificationId, customerId },
    });

    if (!recipient) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notificationRecipient.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(customerId: string) {
    await this.prisma.notificationRecipient.updateMany({
      where: { customerId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { message: 'All notifications marked as read' };
  }

  async sendNotification(data: {
    title: string;
    body: string;
    type: string;
    targetCustomerIds?: string[];
    imageUrl?: string;
    data?: any;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        title: data.title,
        body: data.body,
        type: data.type as any,
        imageUrl: data.imageUrl,
        data: data.data,
      },
    });

    let customerIds = data.targetCustomerIds;
    if (!customerIds || customerIds.length === 0) {
      const customers = await this.prisma.customerProfile.findMany({
        select: { id: true },
      });
      customerIds = customers.map((c) => c.id);
    }

    await this.prisma.notificationRecipient.createMany({
      data: customerIds.map((customerId) => ({
        notificationId: notification.id,
        customerId,
      })),
    });

    return {
      notificationId: notification.id,
      recipientCount: customerIds.length,
    };
  }
}
