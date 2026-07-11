import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(customerId: string) {
    const customer = await this.prisma.customerProfile.findUnique({
      where: { id: customerId },
      include: {
        user: {
          select: { phone: true, email: true, isPhoneVerified: true, isEmailVerified: true },
        },
        addresses: { where: { isActive: true } },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async updateProfile(customerId: string, data: {
    fullName?: string;
    email?: string;
    dateOfBirth?: string;
    profilePhotoUrl?: string;
  }) {
    const customer = await this.prisma.customerProfile.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.prisma.customerProfile.update({
      where: { id: customerId },
      data: {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        isProfileComplete: true,
      },
      include: {
        user: {
          select: { phone: true, email: true },
        },
      },
    });
  }

  async getAddresses(customerId: string) {
    return this.prisma.address.findMany({
      where: { customerId, isActive: true },
      orderBy: { isDefault: 'desc' },
    });
  }

  async updateAddresses(customerId: string, data: any) {
    if (data.addresses) {
      await this.prisma.address.updateMany({
        where: { customerId },
        data: { isActive: false },
      });

      for (const addr of data.addresses) {
        await this.prisma.address.upsert({
          where: { id: addr.id || '' },
          create: {
            customerId,
            label: addr.label,
            fullName: addr.fullName,
            phone: addr.phone,
            houseFlat: addr.houseFlat,
            building: addr.building,
            street: addr.street,
            landmark: addr.landmark,
            area: addr.area,
            city: addr.city,
            state: addr.state,
            postalCode: addr.postalCode,
            latitude: addr.latitude,
            longitude: addr.longitude,
            addressType: addr.addressType || 'HOME',
            isDefault: addr.isDefault || false,
            isActive: true,
          },
          update: {
            ...addr,
            isActive: true,
          },
        });
      }
    }

    return this.getAddresses(customerId);
  }

  async getReferralInfo(customerId: string) {
    const customer = await this.prisma.customerProfile.findUnique({
      where: { id: customerId },
      select: { referralCode: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const referralsMade = await this.prisma.referral.findMany({
      where: { referrerId: customerId },
      include: {
        referred: {
          select: { fullName: true, phone: true },
        },
      },
    });

    return {
      referralCode: customer.referralCode,
      referrals: referralsMade,
      totalReferrals: referralsMade.length,
    };
  }
}
