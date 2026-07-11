import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalCustomers,
      activeCustomers,
      totalOrders,
      todayOrders,
      totalRevenue,
      todayRevenue,
      activeSubscriptions,
      pendingDeliveries,
      totalDeliveryPartners,
      activeDeliveryPartners,
    ] = await Promise.all([
      this.prisma.customerProfile.count(),
      this.prisma.user.count({
        where: { isActive: true, role: null, customerProfile: { isNot: null } },
      }),
      this.prisma.order.count({ where: { status: { not: 'DRAFT' } } }),
      this.prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.order.aggregate({
        where: { status: { in: ['PLACED', 'CONFIRMED', 'DELIVERED'] } },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.aggregate({
        where: {
          status: { in: ['PLACED', 'CONFIRMED', 'DELIVERED'] },
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.delivery.count({ where: { status: { in: ['PENDING', 'ASSIGNED'] } } }),
      this.prisma.deliveryPartnerProfile.count(),
      this.prisma.deliveryPartnerProfile.count({ where: { isActive: true } }),
    ]);

    return {
      customers: { total: totalCustomers, active: activeCustomers },
      orders: { total: totalOrders, today: todayOrders },
      revenue: {
        total: totalRevenue._sum.totalAmount || 0,
        today: todayRevenue._sum.totalAmount || 0,
      },
      subscriptions: { active: activeSubscriptions },
      deliveries: { pending: pendingDeliveries },
      deliveryPartners: { total: totalDeliveryPartners, active: activeDeliveryPartners },
    };
  }

  async getCustomers(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    isActive?: string | boolean;
  }) {
    const { page = 1, limit = 20, search, status, isActive } = query;

    const where: Prisma.CustomerProfileWhereInput = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive === 'true' || status === 'active') {
      where.user = { isActive: true };
    } else if (isActive === 'false' || status === 'inactive') {
      where.user = { isActive: false };
    }

    const [customers, total] = await Promise.all([
      this.prisma.customerProfile.findMany({
        where,
        include: {
          user: { select: { isActive: true, createdAt: true } },
          orders: { select: { totalAmount: true, status: true } },
          subscriptions: { select: { status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: ((Number(page) || 1) - 1) * (Number(limit) || 20),
        take: Number(limit) || 20,
      }),
      this.prisma.customerProfile.count({ where }),
    ]);

    return {
      data: customers,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getCustomerDetails(id: string) {
    const customer = await this.prisma.customerProfile.findUnique({
      where: { id },
      include: {
        user: { select: { phone: true, email: true, isActive: true, createdAt: true } },
        addresses: { where: { isActive: true } },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { items: true },
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        wallet: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async toggleCustomerStatus(id: string) {
    const customer = await this.prisma.customerProfile.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: customer.userId } });
    const isActive = !user?.isActive;

    await this.prisma.user.update({
      where: { id: customer.userId },
      data: { isActive },
    });

    return { id, isActive };
  }

  async getDeliveryPartners(query: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 20, search } = query;

    const where: Prisma.DeliveryPartnerProfileWhereInput = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { employeeId: { contains: search } },
      ];
    }

    const [partners, total] = await Promise.all([
      this.prisma.deliveryPartnerProfile.findMany({
        where,
        include: {
          user: { select: { isActive: true, email: true } },
        } as any,
        orderBy: { createdAt: 'desc' },
        skip: ((Number(page) || 1) - 1) * (Number(limit) || 20),
        take: Number(limit) || 20,
      }),
      this.prisma.deliveryPartnerProfile.count({ where }),
    ]);

    return {
      data: partners,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createDeliveryPartner(data: {
    fullName: string;
    phone: string;
    email?: string;
    employeeId: string;
    serviceAreaId?: string;
    password: string;
  }) {
    const existingPhone = await this.prisma.user.findUnique({ where: { phone: data.phone } });
    if (existingPhone) {
      throw new BadRequestException('Phone number already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          phone: data.phone,
          email: data.email,
          passwordHash,
          role: null,
        },
      });

      return tx.deliveryPartnerProfile.create({
        data: {
          userId: user.id,
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
          employeeId: data.employeeId,
          serviceAreaId: data.serviceAreaId,
        },
      });
    });
  }

  async updateDeliveryPartner(id: string, data: any) {
    const partner = await this.prisma.deliveryPartnerProfile.findUnique({ where: { id } });
    if (!partner) {
      throw new NotFoundException('Delivery partner not found');
    }

    return this.prisma.deliveryPartnerProfile.update({
      where: { id },
      data: {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        serviceAreaId: data.serviceAreaId,
        profilePhotoUrl: data.profilePhotoUrl,
      },
    });
  }

  async toggleDeliveryPartnerStatus(id: string) {
    const partner = await this.prisma.deliveryPartnerProfile.findUnique({ where: { id } });
    if (!partner) {
      throw new NotFoundException('Delivery partner not found');
    }

    await this.prisma.user.update({
      where: { id: partner.userId },
      data: { isActive: !partner.isActive },
    });

    return this.prisma.deliveryPartnerProfile.update({
      where: { id },
      data: { isActive: !partner.isActive },
    });
  }

  async getAdmins(query: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = query;

    const [admins, total] = await Promise.all([
      this.prisma.adminProfile.findMany({
        include: {
          user: { select: { email: true, phone: true, isActive: true, createdAt: true } },
          role: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: ((Number(page) || 1) - 1) * (Number(limit) || 20),
        take: Number(limit) || 20,
      }),
      this.prisma.adminProfile.count(),
    ]);

    return {
      data: admins,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createAdmin(data: {
    fullName: string;
    email: string;
    phone: string;
    roleId: string;
    password: string;
  }) {
    const existingEmail = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existingEmail) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          phone: data.phone,
          passwordHash,
        },
      });

      return tx.adminProfile.create({
        data: {
          userId: user.id,
          fullName: data.fullName,
          email: data.email,
          roleId: data.roleId,
        },
        include: { role: true },
      });
    });
  }

  async updateAdmin(id: string, data: any) {
    const admin = await this.prisma.adminProfile.findUnique({ where: { id } });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return this.prisma.adminProfile.update({
      where: { id },
      data: {
        fullName: data.fullName,
        roleId: data.roleId,
        twoFactorEnabled: data.twoFactorEnabled,
      },
      include: { role: true },
    });
  }

  async toggleAdminStatus(id: string) {
    const admin = await this.prisma.adminProfile.findUnique({ where: { id } });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    await this.prisma.user.update({
      where: { id: admin.userId },
      data: { isActive: !admin.isActive },
    });

    return this.prisma.adminProfile.update({
      where: { id },
      data: { isActive: !admin.isActive },
    });
  }

  async getAllOrders(query: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, limit = 20, status, search, startDate, endDate } = query;

    const where: Prisma.OrderWhereInput = {};

    if (status) {
      where.status = status as any;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customer: { fullName: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search } } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          customer: { select: { fullName: true, phone: true } },
          items: true,
          address: true,
          deliverySlot: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: ((Number(page) || 1) - 1) * (Number(limit) || 20),
        take: Number(limit) || 20,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateOrderStatus(orderId: string, status: string, notes?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: status as any,
        statusHistory: {
          create: {
            status: status as any,
            notes: notes || `Status updated to ${status}`,
          },
        },
      },
      include: { statusHistory: true },
    });
  }

  async getAllSubscriptions(query: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20, status } = query;

    const where: Prisma.SubscriptionWhereInput = {};
    if (status) {
      where.status = status as any;
    }

    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        include: {
          customer: { select: { fullName: true, phone: true } },
          items: true,
          address: true,
          deliverySlot: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: ((Number(page) || 1) - 1) * (Number(limit) || 20),
        take: Number(limit) || 20,
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return {
      data: subscriptions,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
