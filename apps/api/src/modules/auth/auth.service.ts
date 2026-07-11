import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { OtpService } from './otp.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private otpService: OtpService,
  ) {}

  async sendOtp(phone: string, countryCode = '+91') {
    const fullPhone = `${countryCode}${phone}`;

    const recentOtp = await this.prisma.oTPRequest.findFirst({
      where: {
        phone: fullPhone,
        createdAt: {
          gte: new Date(Date.now() - this.configService.get('OTP_RESEND_DELAY_SECONDS', 30) * 1000),
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentOtp) {
      throw new BadRequestException('Please wait before requesting a new OTP');
    }

    const otp = this.otpService.generateOTP();
    const expiresAt = new Date(Date.now() + this.configService.get('OTP_EXPIRY_MINUTES', 5) * 60 * 1000);

    await this.prisma.oTPRequest.create({
      data: {
        phone: fullPhone,
        otp,
        expiresAt,
      },
    });

    await this.otpService.sendOTP(fullPhone, otp);

    return {
      message: 'OTP sent successfully',
      expiresIn: this.configService.get('OTP_EXPIRY_MINUTES', 5) * 60,
    };
  }

  async verifyOtp(phone: string, otp: string, countryCode = '+91') {
    const fullPhone = `${countryCode}${phone}`;

    const otpRequest = await this.prisma.oTPRequest.findFirst({
      where: {
        phone: fullPhone,
        isVerified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRequest) {
      throw new BadRequestException('OTP expired or not found');
    }

    if (otpRequest.attempts >= otpRequest.maxAttempts) {
      throw new BadRequestException('Maximum OTP attempts exceeded');
    }

    if (process.env.NODE_ENV !== 'production' && otp === this.configService.get('OTP_DEV_CODE', '123456')) {
      // Dev mode bypass
    } else if (otpRequest.otp !== otp) {
      await this.prisma.oTPRequest.update({
        where: { id: otpRequest.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid OTP');
    }

    await this.prisma.oTPRequest.update({
      where: { id: otpRequest.id },
      data: { isVerified: true },
    });

    let user = await this.prisma.user.findUnique({
      where: { phone: fullPhone },
    });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const referralCode = this.generateReferralCode();
      user = await this.prisma.user.create({
        data: {
          phone: fullPhone,
          isPhoneVerified: true,
          customerProfile: {
            create: {
              fullName: '',
              phone: fullPhone,
              referralCode,
              isProfileComplete: false,
            },
          },
        },
        include: { customerProfile: true },
      });
    } else {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isPhoneVerified: true },
      });
    }

    const tokens = await this.generateTokens(user.id, fullPhone, 'customer');

    await this.createSession(user.id, tokens.refreshToken);

    return {
      ...tokens,
      isNewUser,
      isProfileComplete: (user as any).customerProfile?.isProfileComplete ?? false,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  async adminLogin(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        adminProfile: {
          include: { role: true },
        },
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (!user.adminProfile) {
      throw new UnauthorizedException('Not an admin account');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email || '', 'admin');

    await this.createSession(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        adminProfile: user.adminProfile,
      },
    };
  }

  async deliveryPartnerLogin(identifier: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier },
        ],
      },
      include: { deliveryProfile: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (!user.deliveryProfile) {
      throw new UnauthorizedException('Not a delivery partner account');
    }

    if (!user.deliveryProfile.isActive) {
      throw new UnauthorizedException('Delivery partner account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, identifier, 'delivery');

    await this.createSession(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        deliveryProfile: user.deliveryProfile,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || !session.isActive || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { isActive: false },
    });

    const tokens = await this.generateTokens(
      session.userId,
      session.user.phone,
      'customer',
    );

    await this.createSession(session.userId, tokens.refreshToken);

    return tokens;
  }

  async logout(refreshToken: string) {
    await this.prisma.session.updateMany({
      where: { refreshToken },
      data: { isActive: false },
    });
    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
    return { message: 'Logged out from all devices' };
  }

  private async generateTokens(userId: string, identifier: string, type: string) {
    const payload = { sub: userId, phone: identifier, type };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRY', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRY', '7d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }

  private async createSession(userId: string, refreshToken: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return this.prisma.session.create({
      data: {
        userId,
        refreshToken,
        expiresAt,
      },
    });
  }

  private generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'WB';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
