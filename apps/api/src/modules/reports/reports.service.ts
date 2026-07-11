import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getSalesReport(query: { startDate: string; endDate: string; groupBy?: string }) {
    const start = new Date(query.startDate);
    const end = new Date(query.endDate);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: { in: ['PLACED', 'CONFIRMED', 'DELIVERED'] },
      },
      select: {
        totalAmount: true,
        createdAt: true,
        status: true,
        paymentMethod: true,
      },
    });

    const totalSales = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    return {
      totalSales,
      totalOrders,
      avgOrderValue,
      orders,
    };
  }

  async getOrdersReport(query: { startDate: string; endDate: string; groupBy?: string }) {
    const start = new Date(query.startDate);
    const end = new Date(query.endDate);

    const [total, byStatus, byPaymentMethod] = await Promise.all([
      this.prisma.order.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { createdAt: { gte: start, lte: end } },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.groupBy({
        by: ['paymentMethod'],
        where: { createdAt: { gte: start, lte: end } },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
    ]);

    return { total, byStatus, byPaymentMethod };
  }

  async getCustomerAnalytics(query: { startDate: string; endDate: string }) {
    const start = new Date(query.startDate);
    const end = new Date(query.endDate);

    const [newCustomers, totalCustomers, topSpenders] = await Promise.all([
      this.prisma.customerProfile.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
      this.prisma.customerProfile.count(),
      this.prisma.customerProfile.findMany({
        include: {
          orders: {
            where: { createdAt: { gte: start, lte: end } },
            select: { totalAmount: true },
          },
        },
        take: 10,
      }),
    ]);

    const rankedSpenders = topSpenders
      .map((c) => ({
        customerId: c.id,
        fullName: c.fullName,
        totalSpent: c.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
        orderCount: c.orders.length,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent);

    return { newCustomers, totalCustomers, topSpenders: rankedSpenders };
  }

  async getSubscriptionReport(query: { startDate: string; endDate: string }) {
    const start = new Date(query.startDate);
    const end = new Date(query.endDate);

    const [total, byStatus, byFrequency] = await Promise.all([
      this.prisma.subscription.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
      this.prisma.subscription.groupBy({
        by: ['status'],
        where: { createdAt: { gte: start, lte: end } },
        _count: { id: true },
      }),
      this.prisma.subscription.groupBy({
        by: ['frequency'],
        where: { createdAt: { gte: start, lte: end } },
        _count: { id: true },
      }),
    ]);

    return { total, byStatus, byFrequency };
  }

  async getDeliveryPerformance(query: { startDate: string; endDate: string }) {
    const start = new Date(query.startDate);
    const end = new Date(query.endDate);

    const [totalDeliveries, byStatus, failedReasons] = await Promise.all([
      this.prisma.delivery.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
      this.prisma.delivery.groupBy({
        by: ['status'],
        where: { createdAt: { gte: start, lte: end } },
        _count: { id: true },
      }),
      this.prisma.delivery.groupBy({
        by: ['failedReason'],
        where: {
          createdAt: { gte: start, lte: end },
          status: 'FAILED',
        },
        _count: { id: true },
      }),
    ]);

    const successRate = totalDeliveries > 0
      ? ((totalDeliveries - (failedReasons.find((f) => f.failedReason === null)?._count.id || 0)) / totalDeliveries) * 100
      : 0;

    return { totalDeliveries, byStatus, failedReasons, successRate };
  }

  async getProductPerformance(query: { startDate: string; endDate: string }) {
    const start = new Date(query.startDate);
    const end = new Date(query.endDate);

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: start, lte: end },
          status: { in: ['PLACED', 'CONFIRMED', 'DELIVERED'] },
        },
      },
      include: { productVariant: { include: { product: true } } },
    });

    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();

    for (const item of orderItems) {
      const key = item.productVariantId;
      const existing = productMap.get(key) || {
        name: item.productName,
        quantity: 0,
        revenue: 0,
      };
      existing.quantity += item.quantity;
      existing.revenue += Number(item.total);
      productMap.set(key, existing);
    }

    const products = Array.from(productMap.entries())
      .map(([id, data]) => ({ productVariantId: id, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    return { products };
  }

  async getRevenueReport(query: { startDate: string; endDate: string }) {
    const start = new Date(query.startDate);
    const end = new Date(query.endDate);

    const [orders, walletTransactions] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: start, lte: end },
          status: { in: ['PLACED', 'CONFIRMED', 'DELIVERED'] },
        },
        _sum: {
          totalAmount: true,
          discount: true,
          tax: true,
          deliveryCharge: true,
          bottleDeposit: true,
          walletDeduction: true,
        },
      }),
      this.prisma.walletTransaction.aggregate({
        where: {
          createdAt: { gte: start, lte: end },
          status: 'PAID',
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    return {
      orderRevenue: orders._sum,
      walletActivity: {
        totalAmount: walletTransactions._sum.amount,
        transactionCount: walletTransactions._count.id,
      },
    };
  }

  async getBottleReport(query: { startDate: string; endDate: string }) {
    const start = new Date(query.startDate);
    const end = new Date(query.endDate);

    const transactions = await this.prisma.bottleTransaction.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { bottleType: true },
    });

    const byType = transactions.reduce((acc, t) => {
      if (!acc[t.type]) {
        acc[t.type] = { quantity: 0, count: 0 };
      }
      acc[t.type].quantity += t.quantity;
      acc[t.type].count += 1;
      return acc;
    }, {} as Record<string, { quantity: number; count: number }>);

    return { totalTransactions: transactions.length, byType };
  }
}
