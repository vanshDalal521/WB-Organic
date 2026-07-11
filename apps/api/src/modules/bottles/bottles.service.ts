import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class BottlesService {
  constructor(private prisma: PrismaService) {}

  async getBottleTypes() {
    return this.prisma.bottleType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getCustomerLedger(customerId: string) {
    const ledger = await this.prisma.customerBottleLedger.findMany({
      where: { customerId },
      include: { bottleType: true },
    });

    return ledger;
  }

  async getTransactions(customerId: string, query: {
    page?: number;
    limit?: number;
    type?: string;
  }) {
    const { page = 1, limit = 20, type } = query;

    const where: Prisma.BottleTransactionWhereInput = { customerId };

    if (type) {
      where.type = type as any;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.bottleTransaction.findMany({
        where,
        include: { bottleType: true },
        orderBy: { createdAt: 'desc' },
        skip: ((Number(page) || 1) - 1) * (Number(limit) || 20),
        take: Number(limit) || 20,
      }),
      this.prisma.bottleTransaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAllCustomerLedgers(query: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { page = 1, limit = 20, search } = query;

    const where: Prisma.CustomerBottleLedgerWhereInput = {};

    if (search) {
      where.customer = {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      };
    }

    const [ledgers, total] = await Promise.all([
      this.prisma.customerBottleLedger.findMany({
        where,
        include: {
          bottleType: true,
          customer: { select: { fullName: true, phone: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: ((Number(page) || 1) - 1) * (Number(limit) || 20),
        take: Number(limit) || 20,
      }),
      this.prisma.customerBottleLedger.count({ where }),
    ]);

    return {
      data: ledgers,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAllTransactions(query: {
    page?: number;
    limit?: number;
    type?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, limit = 20, type, customerId, startDate, endDate } = query;

    const where: Prisma.BottleTransactionWhereInput = {};

    if (type) where.type = type as any;
    if (customerId) where.customerId = customerId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      this.prisma.bottleTransaction.findMany({
        where,
        include: {
          bottleType: true,
        } as any,
        orderBy: { createdAt: 'desc' },
        skip: ((Number(page) || 1) - 1) * (Number(limit) || 20),
        take: Number(limit) || 20,
      }),
      this.prisma.bottleTransaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async adjustBottleCount(data: {
    customerId: string;
    bottleTypeId: string;
    adjustment: number;
    reason: string;
  }) {
    const ledger = await this.prisma.customerBottleLedger.findUnique({
      where: {
        customerId_bottleTypeId: {
          customerId: data.customerId,
          bottleTypeId: data.bottleTypeId,
        },
      },
    });

    if (!ledger) {
      throw new NotFoundException('Bottle ledger not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.bottleTransaction.create({
        data: {
          customerId: data.customerId,
          bottleTypeId: data.bottleTypeId,
          type: 'ADJUSTED',
          quantity: Math.abs(data.adjustment),
          reason: data.reason,
          adminNotes: `Adjustment: ${data.adjustment > 0 ? '+' : ''}${data.adjustment}`,
        },
      });

      return tx.customerBottleLedger.update({
        where: {
          customerId_bottleTypeId: {
            customerId: data.customerId,
            bottleTypeId: data.bottleTypeId,
          },
        },
        data: {
          adjustedCount: { increment: data.adjustment > 0 ? data.adjustment : 0 },
        },
      });
    });
  }

  async reconcileBottles(data: {
    customerId: string;
    bottleTypeId: string;
    actualCount: number;
    notes?: string;
  }) {
    const ledger = await this.prisma.customerBottleLedger.findUnique({
      where: {
        customerId_bottleTypeId: {
          customerId: data.customerId,
          bottleTypeId: data.bottleTypeId,
        },
      },
    });

    if (!ledger) {
      throw new NotFoundException('Bottle ledger not found');
    }

    const expectedCount = ledger.issuedCount - ledger.collectedCount;
    const discrepancy = data.actualCount - expectedCount;

    return this.prisma.$transaction(async (tx) => {
      if (discrepancy !== 0) {
        await tx.bottleTransaction.create({
          data: {
            customerId: data.customerId,
            bottleTypeId: data.bottleTypeId,
            type: 'ADJUSTED',
            quantity: Math.abs(discrepancy),
            reason: 'Reconciliation',
            adminNotes: data.notes || `Reconciliation adjustment: ${discrepancy > 0 ? '+' : ''}${discrepancy}`,
          },
        });
      }

      return {
        expectedCount,
        actualCount: data.actualCount,
        discrepancy,
        notes: data.notes,
      };
    });
  }
}
