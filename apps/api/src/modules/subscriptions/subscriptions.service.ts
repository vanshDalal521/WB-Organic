import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async createSubscription(customerId: string, data: {
    addressId: string;
    frequency: string;
    customDays?: number[];
    startDate: string;
    deliverySlotId?: string;
    paymentMethod: string;
    items: { productVariantId: string; quantity: number }[];
  }) {
    const customer = await this.prisma.customerProfile.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const address = await this.prisma.address.findUnique({ where: { id: data.addressId } });
    if (!address || address.customerId !== customerId) {
      throw new NotFoundException('Address not found');
    }

    let totalAmount = new Prisma.Decimal(0);
    const subscriptionItems: Prisma.SubscriptionItemUncheckedCreateWithoutSubscriptionInput[] = [];

    for (const item of data.items) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: item.productVariantId },
        include: { product: true },
      });

      if (!variant || !variant.isActive) {
        throw new BadRequestException(`Product variant ${item.productVariantId} not found`);
      }

      const itemTotal = new Prisma.Decimal(variant.price).mul(item.quantity);
      totalAmount = totalAmount.add(itemTotal);

      subscriptionItems.push({
        productVariantId: variant.id,
        productName: variant.product.name,
        variantName: variant.name,
        quantity: item.quantity,
        unitPrice: variant.price,
      });
    }

    const nextDeliveryDate = this.calculateNextDeliveryDate(
      new Date(data.startDate),
      data.frequency,
      data.customDays,
    );

    return this.prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.create({
        data: {
          customerId,
          status: 'ACTIVE',
          frequency: data.frequency as any,
          customDays: data.customDays || [],
          startDate: new Date(data.startDate),
          addressId: data.addressId,
          deliverySlotId: data.deliverySlotId,
          paymentMethod: data.paymentMethod as any,
          nextDeliveryDate,
          totalAmount,
          items: { create: subscriptionItems },
          statusHistory: {
            create: {
              status: 'ACTIVE',
              notes: 'Subscription created',
            },
          },
        },
        include: {
          items: true,
          address: true,
          deliverySlot: true,
        },
      });

      return subscription;
    });
  }

  async getSubscriptions(customerId: string, status?: string) {
    const where: Prisma.SubscriptionWhereInput = { customerId };
    if (status) {
      where.status = status as any;
    }

    return this.prisma.subscription.findMany({
      where,
      include: {
        items: {
          include: { productVariant: { include: { product: true } } },
        },
        address: true,
        deliverySlot: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSubscriptionDetails(id: string, customerId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id, customerId },
      include: {
        items: {
          include: { productVariant: { include: { product: true } } },
        },
        address: true,
        deliverySlot: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        deliveries: { orderBy: { deliveryDate: 'desc' }, take: 10 },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  async pauseSubscription(id: string, customerId: string, reason?: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id, customerId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status !== 'ACTIVE') {
      throw new BadRequestException('Only active subscriptions can be paused');
    }

    return this.prisma.subscription.update({
      where: { id },
      data: {
        status: 'PAUSED',
        statusHistory: {
          create: {
            status: 'PAUSED',
            notes: reason || 'Paused by customer',
          },
        },
      },
      include: { items: true },
    });
  }

  async resumeSubscription(id: string, customerId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id, customerId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status !== 'PAUSED') {
      throw new BadRequestException('Only paused subscriptions can be resumed');
    }

    const nextDeliveryDate = this.calculateNextDeliveryDate(
      new Date(),
      subscription.frequency,
      subscription.customDays,
    );

    return this.prisma.subscription.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        nextDeliveryDate,
        statusHistory: {
          create: {
            status: 'ACTIVE',
            notes: 'Resumed by customer',
          },
        },
      },
      include: { items: true },
    });
  }

  async skipDelivery(id: string, customerId: string, deliveryDate: string, reason?: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id, customerId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status !== 'ACTIVE') {
      throw new BadRequestException('Only active subscriptions can skip deliveries');
    }

    const delivery = await this.prisma.subscriptionDelivery.findFirst({
      where: {
        subscriptionId: id,
        deliveryDate: new Date(deliveryDate),
      },
    });

    if (delivery) {
      await this.prisma.subscriptionDelivery.update({
        where: { id: delivery.id },
        data: {
          isSkipped: true,
          skipReason: reason || 'Skipped by customer',
        },
      });
    }

    return { message: 'Delivery skipped successfully' };
  }

  async cancelSubscription(id: string, customerId: string, reason?: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id, customerId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (!['ACTIVE', 'PAUSED'].includes(subscription.status)) {
      throw new BadRequestException('Subscription cannot be cancelled');
    }

    return this.prisma.subscription.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        statusHistory: {
          create: {
            status: 'CANCELLED',
            notes: reason || 'Cancelled by customer',
          },
        },
      },
      include: { items: true },
    });
  }

  private calculateNextDeliveryDate(startDate: Date, frequency: string, customDays?: number[]): Date {
    const next = new Date(startDate);

    switch (frequency) {
      case 'DAILY':
        next.setDate(next.getDate() + 1);
        break;
      case 'ALTERNATE_DAYS':
        next.setDate(next.getDate() + 2);
        break;
      case 'WEEKLY':
        next.setDate(next.getDate() + 7);
        break;
      case 'MONTHLY':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'CUSTOM':
        if (customDays && customDays.length > 0) {
          next.setDate(next.getDate() + customDays[0]);
        }
        break;
      default:
        next.setDate(next.getDate() + 1);
    }

    return next;
  }
}
