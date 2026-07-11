import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createOrder(customerId: string, data: {
    addressId: string;
    deliveryDate: string;
    deliverySlotId?: string;
    paymentMethod: string;
    couponCode?: string;
    useWallet?: boolean;
    walletAmount?: number;
    notes?: string;
    items: {
      productVariantId: string;
      quantity: number;
    }[];
  }) {
    const idempotencyKey = uuidv4();

    const existingOrder = await this.prisma.order.findUnique({
      where: { idempotencyKey },
    });

    if (existingOrder) {
      throw new ConflictException('Order already exists');
    }

    const customer = await this.prisma.customerProfile.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const address = await this.prisma.address.findUnique({
      where: { id: data.addressId },
    });

    if (!address || address.customerId !== customerId) {
      throw new NotFoundException('Address not found');
    }

    const serviceArea = await this.prisma.serviceArea.findFirst({
      where: {
        postalCodes: { has: address.postalCode },
        isActive: true,
      },
    });

    if (!serviceArea) {
      throw new BadRequestException('Delivery not available in your area');
    }

    let subtotal = new Prisma.Decimal(0);
    let totalTax = new Prisma.Decimal(0);
    let totalBottleDeposit = new Prisma.Decimal(0);
    const orderItems: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] = [];

    for (const item of data.items) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: item.productVariantId },
        include: { product: true },
      });

      if (!variant || !variant.isActive) {
        throw new BadRequestException(`Product variant ${item.productVariantId} not found`);
      }

      if (variant.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${variant.product.name}`);
      }

      const itemTotal = new Prisma.Decimal(variant.price).mul(item.quantity);
      const itemDiscount = variant.discountPrice
        ? new Prisma.Decimal(variant.price).sub(variant.discountPrice).mul(item.quantity)
        : new Prisma.Decimal(0);
      const itemTax = itemTotal.sub(itemDiscount).mul(variant.taxRate).div(100);
      const bottleDeposit = variant.bottleDeposit
        ? new Prisma.Decimal(variant.bottleDeposit).mul(item.quantity)
        : new Prisma.Decimal(0);

      subtotal = subtotal.add(itemTotal).sub(itemDiscount);
      totalTax = totalTax.add(itemTax);
      totalBottleDeposit = totalBottleDeposit.add(bottleDeposit);

      orderItems.push({
        productVariantId: variant.id,
        productName: variant.product.name,
        variantName: variant.name,
        quantity: item.quantity,
        unitPrice: variant.price,
        discount: itemDiscount,
        tax: itemTax,
        total: itemTotal.sub(itemDiscount).add(itemTax),
      });
    }

    const deliveryCharge = subtotal.gte(serviceArea.minimumOrder)
      ? new Prisma.Decimal(0)
      : serviceArea.deliveryCharge;

    let discount = new Prisma.Decimal(0);
    if (data.couponCode) {
      const coupon = await this.prisma.coupon.findUnique({
        where: { code: data.couponCode },
      });

      if (coupon && coupon.isActive && coupon.startAt <= new Date() && coupon.endAt >= new Date()) {
        if (coupon.discountType === 'PERCENTAGE') {
          discount = subtotal.mul(coupon.discountValue).div(100);
          if (coupon.maxDiscount && discount.greaterThan(coupon.maxDiscount)) {
            discount = coupon.maxDiscount;
          }
        } else {
          discount = coupon.discountValue;
        }
      }
    }

    let walletDeduction = new Prisma.Decimal(0);
    if (data.useWallet && data.walletAmount && data.walletAmount > 0) {
      const wallet = await this.prisma.wallet.findUnique({
        where: { customerId },
      });

      if (!wallet || wallet.balance.lessThan(data.walletAmount)) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      walletDeduction = new Prisma.Decimal(data.walletAmount);
    }

    const totalAmount = subtotal
      .add(totalTax)
      .add(totalBottleDeposit)
      .add(deliveryCharge)
      .sub(discount)
      .sub(walletDeduction);

    const orderNumber = this.generateOrderNumber();

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          addressId: data.addressId,
          deliveryDate: new Date(data.deliveryDate),
          deliverySlotId: data.deliverySlotId,
          subtotal,
          discount,
          tax: totalTax,
          deliveryCharge,
          bottleDeposit: totalBottleDeposit,
          walletDeduction,
          totalAmount,
          paymentMethod: data.paymentMethod as any,
          notes: data.notes,
          couponCode: data.couponCode,
          idempotencyKey,
          items: {
            create: orderItems,
          },
          statusHistory: {
            create: {
              status: 'PLACED',
              notes: 'Order placed successfully',
            },
          },
        },
        include: {
          items: true,
          address: true,
          statusHistory: true,
        },
      });

      for (const item of data.items) {
        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      if (walletDeduction.greaterThan(0)) {
        const wallet = await tx.wallet.findUnique({
          where: { customerId },
        });

        if (wallet) {
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: wallet.balance.sub(walletDeduction) },
          });

          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: 'ORDER_PAYMENT',
              amount: walletDeduction,
              balanceBefore: wallet.balance,
              balanceAfter: wallet.balance.sub(walletDeduction),
              status: 'PAID',
              description: `Order ${orderNumber} payment`,
              referenceId: newOrder.id,
              idempotencyKey: uuidv4(),
            },
          });
        }
      }

      return newOrder;
    });

    return order;
  }

  async getCustomerOrders(customerId: string, query: {
    page?: number;
    limit?: number;
    status?: string;
    tab?: string;
  }) {
    const { page = 1, limit = 20, tab } = query;

    const where: Prisma.OrderWhereInput = { customerId };

    if (tab === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      where.deliveryDate = { gte: today, lt: tomorrow };
    } else if (tab === 'upcoming') {
      where.deliveryDate = { gt: new Date() };
      where.status = { notIn: ['CANCELLED', 'DELIVERED', 'REFUNDED'] };
    } else if (tab === 'past') {
      where.status = 'DELIVERED';
    } else if (tab === 'cancelled') {
      where.status = 'CANCELLED';
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              productVariant: {
                include: { product: true },
              },
            },
          },
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
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderDetails(orderId: string, customerId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerId },
      include: {
        items: {
          include: {
            productVariant: {
              include: { product: true },
            },
          },
        },
        address: true,
        deliverySlot: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        payments: true,
        deliveries: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async cancelOrder(orderId: string, customerId: string, reason?: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!['PLACED', 'CONFIRMED', 'SCHEDULED'].includes(order.status)) {
      throw new BadRequestException('Order cannot be cancelled at this stage');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          statusHistory: {
            create: {
              status: 'CANCELLED',
              notes: reason || 'Cancelled by customer',
            },
          },
        },
        include: {
          items: true,
          statusHistory: true,
        },
      });

      for (const item of updatedOrder.items) {
        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { stock: { increment: item.quantity } },
        });
      }

      if (order.walletDeduction.greaterThan(0)) {
        const wallet = await tx.wallet.findUnique({
          where: { customerId },
        });

        if (wallet) {
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: wallet.balance.add(order.walletDeduction) },
          });

          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: 'REFUND',
              amount: order.walletDeduction,
              balanceBefore: wallet.balance,
              balanceAfter: wallet.balance.add(order.walletDeduction),
              status: 'PAID',
              description: `Refund for cancelled order ${order.orderNumber}`,
              referenceId: orderId,
              idempotencyKey: uuidv4(),
            },
          });
        }
      }

      return updatedOrder;
    });
  }

  private generateOrderNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `WBOD-${year}-${random}`;
  }
}
