import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async createTicket(customerId: string, data: {
    category: string;
    subject: string;
    orderId?: string;
    subscriptionId?: string;
    priority?: string;
    message: string;
  }) {
    const ticketNumber = this.generateTicketNumber();

    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.supportTicket.create({
        data: {
          ticketNumber,
          customerId,
          category: data.category as any,
          subject: data.subject,
          orderId: data.orderId,
          subscriptionId: data.subscriptionId,
          priority: data.priority || 'MEDIUM',
          messages: {
            create: {
              senderId: customerId,
              senderType: 'CUSTOMER',
              message: data.message,
            },
          },
        },
        include: { messages: true },
      });

      return ticket;
    });
  }

  async getTickets(customerId: string, query: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const { page = 1, limit = 20, status } = query;

    const where: Prisma.SupportTicketWhereInput = { customerId };
    if (status) {
      where.status = status as any;
    }

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } },
        orderBy: { createdAt: 'desc' },
        skip: ((Number(page) || 1) - 1) * (Number(limit) || 20),
        take: Number(limit) || 20,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      data: tickets,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getTicketDetails(ticketId: string, customerId: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id: ticketId, customerId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        customer: { select: { fullName: true, phone: true } },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async addMessage(ticketId: string, customerId: string, senderId: string, data: {
    message: string;
    attachmentUrl?: string;
  }) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id: ticketId, customerId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.status === 'CLOSED') {
      throw new BadRequestException('Cannot add message to a closed ticket');
    }

    return this.prisma.$transaction(async (tx) => {
      const message = await tx.supportMessage.create({
        data: {
          ticketId,
          senderId,
          senderType: 'CUSTOMER',
          message: data.message,
          attachmentUrl: data.attachmentUrl,
        },
      });

      if (ticket.status === 'RESOLVED') {
        await tx.supportTicket.update({
          where: { id: ticketId },
          data: { status: 'IN_PROGRESS' },
        });
      }

      return message;
    });
  }

  async getAllTickets(query: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
  }) {
    const { page = 1, limit = 20, status, category } = query;

    const where: Prisma.SupportTicketWhereInput = {};
    if (status) where.status = status as any;
    if (category) where.category = category as any;

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: {
          customer: { select: { fullName: true, phone: true, email: true } },
          messages: { take: 1, orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip: ((Number(page) || 1) - 1) * (Number(limit) || 20),
        take: Number(limit) || 20,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      data: tickets,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateTicketStatus(ticketId: string, status: string, _notes?: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: status as any },
      include: { messages: true },
    });
  }

  private generateTicketNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `WBTS-${year}-${random}`;
  }
}
