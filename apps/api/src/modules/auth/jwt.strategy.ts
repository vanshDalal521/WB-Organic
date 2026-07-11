import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; phone: string; type: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        customerProfile: true,
        deliveryProfile: true,
        adminProfile: {
          include: { role: true },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      type: payload.type,
      customerProfile: user.customerProfile,
      deliveryProfile: user.deliveryProfile,
      adminProfile: user.adminProfile,
    };
  }
}
