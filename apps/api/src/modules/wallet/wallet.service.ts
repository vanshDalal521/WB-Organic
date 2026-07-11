import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, WalletTransactionType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getWallet(customerId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { customerId },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          customerId,
          balance: 0,
          promotionalBalance: 0,
        },
      });
    }

    return wallet;
  }

  async getTransactions(customerId: string, query: {
    page?: number;
    limit?: number;
    type?: WalletTransactionType;
  }) {
    const { page = 1, limit = 20, type } = query;

    const wallet = await this.getWallet(customerId);

    const where: Prisma.WalletTransactionWhereInput = {
      walletId: wallet.id,
    };

    if (type) {
      where.type = type;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: ((Number(page) || 1) - 1) * (Number(limit) || 20),
        take: Number(limit) || 20,
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAllTransactions(query: {
    page?: number;
    limit?: number;
    type?: WalletTransactionType;
    customerId?: string;
  }) {
    const { page = 1, limit = 20, type, customerId } = query;

    const where: Prisma.WalletTransactionWhereInput = {};
    if (type) where.type = type;
    if (customerId) {
      const wallet = await this.getWallet(customerId);
      where.walletId = wallet.id;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: ((Number(page) || 1) - 1) * (Number(limit) || 20),
        take: Number(limit) || 20,
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async addMoney(customerId: string, amount: number) {
    if (amount < 100) {
      throw new BadRequestException('Minimum recharge amount is ₹100');
    }

    if (amount > 10000) {
      throw new BadRequestException('Maximum recharge amount is ₹10,000');
    }

    const wallet = await this.getWallet(customerId);

    return this.prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: wallet.balance.add(amount) },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'RECHARGE',
          amount: new Prisma.Decimal(amount),
          balanceBefore: wallet.balance,
          balanceAfter: updatedWallet.balance,
          status: 'PAID',
          description: `Added ₹${amount} to wallet`,
          idempotencyKey: uuidv4(),
        },
      });

      return updatedWallet;
    });
  }

  async deductForOrder(customerId: string, orderId: string, amount: number) {
    const wallet = await this.getWallet(customerId);

    if (wallet.balance.lessThan(amount)) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: wallet.balance.sub(amount) },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'ORDER_PAYMENT',
          amount: new Prisma.Decimal(amount),
          balanceBefore: wallet.balance,
          balanceAfter: updatedWallet.balance,
          status: 'PAID',
          description: `Order payment`,
          referenceId: orderId,
          idempotencyKey: uuidv4(),
        },
      });

      return updatedWallet;
    });
  }

  async refundToWallet(customerId: string, orderId: string, amount: number, reason?: string) {
    const wallet = await this.getWallet(customerId);

    return this.prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: wallet.balance.add(amount) },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'REFUND',
          amount: new Prisma.Decimal(amount),
          balanceBefore: wallet.balance,
          balanceAfter: updatedWallet.balance,
          status: 'PAID',
          description: reason || 'Refund',
          referenceId: orderId,
          idempotencyKey: uuidv4(),
        },
      });

      return updatedWallet;
    });
  }

  async creditReferralReward(customerId: string, referralId: string, amount: number) {
    const wallet = await this.getWallet(customerId);

    return this.prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { promotionalBalance: wallet.promotionalBalance.add(amount) },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'REFERRAL_REWARD',
          amount: new Prisma.Decimal(amount),
          balanceBefore: wallet.promotionalBalance,
          balanceAfter: updatedWallet.promotionalBalance,
          status: 'PAID',
          description: 'Referral reward credited',
          referenceId: referralId,
          idempotencyKey: uuidv4(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      return updatedWallet;
    });
  }
}
