import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  async getRoutes(partnerId: string, date?: string) {
    const where: Prisma.RouteWhereInput = { deliveryPartnerId: partnerId };

    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.date = { gte: targetDate, lt: nextDay };
    }

    return this.prisma.route.findMany({
      where,
      include: {
        stops: { include: { address: true, order: { select: { orderNumber: true } } } },
        serviceArea: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getRouteDetails(routeId: string, partnerId: string) {
    const route = await this.prisma.route.findFirst({
      where: { id: routeId, deliveryPartnerId: partnerId },
      include: {
        stops: {
          include: {
            address: true,
            order: {
              include: { items: true },
            },
          },
          orderBy: { sequence: 'asc' },
        },
        serviceArea: true,
      },
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    return route;
  }

  async startRoute(routeId: string, partnerId: string) {
    const route = await this.prisma.route.findFirst({
      where: { id: routeId, deliveryPartnerId: partnerId },
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    if (route.status !== 'PLANNED') {
      throw new BadRequestException('Route already started or completed');
    }

    return this.prisma.route.update({
      where: { id: routeId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });
  }

  async completeRoute(routeId: string, partnerId: string) {
    const route = await this.prisma.route.findFirst({
      where: { id: routeId, deliveryPartnerId: partnerId },
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    return this.prisma.route.update({
      where: { id: routeId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }

  async getDeliveries(partnerId: string, query: { date?: string; status?: string }) {
    const where: Prisma.DeliveryWhereInput = { deliveryPartnerId: partnerId };

    if (query.status) {
      where.status = query.status as any;
    }

    if (query.date) {
      const targetDate = new Date(query.date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.createdAt = { gte: targetDate, lt: nextDay };
    }

    return this.prisma.delivery.findMany({
      where,
      include: {
        order: {
          include: {
            customer: { select: { fullName: true, phone: true } },
            items: true,
            address: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDeliveryDetails(deliveryId: string, partnerId: string) {
    const delivery = await this.prisma.delivery.findFirst({
      where: { id: deliveryId, deliveryPartnerId: partnerId },
      include: {
        order: {
          include: {
            customer: { select: { fullName: true, phone: true } },
            items: { include: { productVariant: { include: { product: true } } } },
            address: true,
          },
        },
        attempts: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    return delivery;
  }

  async updateDeliveryStatus(
    deliveryId: string,
    partnerId: string,
    data: {
      status: string;
      notes?: string;
      failedReason?: string;
      latitude?: number;
      longitude?: number;
      proofUrl?: string;
    },
  ) {
    const delivery = await this.prisma.delivery.findFirst({
      where: { id: deliveryId, deliveryPartnerId: partnerId },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    const updateData: Prisma.DeliveryUpdateInput = {
      status: data.status as any,
      notes: data.notes,
      latitude: data.latitude,
      longitude: data.longitude,
    };

    if (data.failedReason) {
      updateData.failedReason = data.failedReason as any;
    }

    if (data.proofUrl) {
      updateData.proofType = 'PHOTO';
      updateData.proofUrl = data.proofUrl;
    }

    return this.prisma.delivery.update({
      where: { id: deliveryId },
      data: updateData,
      include: { order: true },
    });
  }

  async recordDeliveryAttempt(
    deliveryId: string,
    partnerId: string,
    data: {
      status: string;
      reason?: string;
      notes?: string;
      proofUrl?: string;
      latitude?: number;
      longitude?: number;
    },
  ) {
    const delivery = await this.prisma.delivery.findFirst({
      where: { id: deliveryId, deliveryPartnerId: partnerId },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    return this.prisma.deliveryAttempt.create({
      data: {
        deliveryId,
        status: data.status as any,
        reason: data.reason as any,
        notes: data.notes,
        proofUrl: data.proofUrl,
        latitude: data.latitude,
        longitude: data.longitude,
      },
    });
  }

  async getAttendance(partnerId: string, query: { startDate?: string; endDate?: string }) {
    const where: Prisma.AttendanceWhereInput = { deliveryPartnerId: partnerId };

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    return this.prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async checkIn(partnerId: string, data: { latitude: number; longitude: number; selfieUrl?: string }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.attendance.findUnique({
      where: {
        deliveryPartnerId_date: {
          deliveryPartnerId: partnerId,
          date: today,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Already checked in today');
    }

    return this.prisma.attendance.create({
      data: {
        deliveryPartnerId: partnerId,
        date: today,
        status: 'CHECKED_IN',
        checkInTime: new Date(),
        checkInLatitude: data.latitude,
        checkInLongitude: data.longitude,
        selfieUrl: data.selfieUrl,
      },
    });
  }

  async checkOut(partnerId: string, data: { latitude: number; longitude: number }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.attendance.findUnique({
      where: {
        deliveryPartnerId_date: {
          deliveryPartnerId: partnerId,
          date: today,
        },
      },
    });

    if (!attendance) {
      throw new BadRequestException('No check-in found for today');
    }

    return this.prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        status: 'CHECKED_OUT',
        checkOutTime: new Date(),
        checkOutLatitude: data.latitude,
        checkOutLongitude: data.longitude,
      },
    });
  }

  async getCollections(partnerId: string, date?: string) {
    const where: Prisma.CollectionWhereInput = { deliveryPartnerId: partnerId };

    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.createdAt = { gte: targetDate, lt: nextDay };
    }

    return this.prisma.collection.findMany({
      where,
      include: {
        order: { select: { orderNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markCollectionCollected(collectionId: string, partnerId: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, deliveryPartnerId: partnerId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    return this.prisma.collection.update({
      where: { id: collectionId },
      data: {
        status: 'COLLECTED',
        collectedAt: new Date(),
      },
    });
  }

  async getBottleLedger(partnerId: string) {
    return this.prisma.deliveryPartnerBottleLedger.findMany({
      where: { deliveryPartnerId: partnerId },
      include: { bottleType: true },
    });
  }
}
