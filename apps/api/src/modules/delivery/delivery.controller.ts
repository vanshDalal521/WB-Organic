import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Delivery')
@Controller('delivery')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('routes')
  @ApiOperation({ summary: 'Get delivery routes for partner' })
  async getRoutes(
    @CurrentUser('deliveryProfile.id') partnerId: string,
    @Query('date') date?: string,
  ) {
    return this.deliveryService.getRoutes(partnerId, date);
  }

  @Get('routes/:id')
  @ApiOperation({ summary: 'Get route details' })
  async getRouteDetails(
    @CurrentUser('deliveryProfile.id') partnerId: string,
    @Param('id') id: string,
  ) {
    return this.deliveryService.getRouteDetails(id, partnerId);
  }

  @Patch('routes/:id/start')
  @ApiOperation({ summary: 'Start a delivery route' })
  async startRoute(
    @CurrentUser('deliveryProfile.id') partnerId: string,
    @Param('id') id: string,
  ) {
    return this.deliveryService.startRoute(id, partnerId);
  }

  @Patch('routes/:id/complete')
  @ApiOperation({ summary: 'Complete a delivery route' })
  async completeRoute(
    @CurrentUser('deliveryProfile.id') partnerId: string,
    @Param('id') id: string,
  ) {
    return this.deliveryService.completeRoute(id, partnerId);
  }

  @Get('deliveries')
  @ApiOperation({ summary: 'Get deliveries for partner' })
  async getDeliveries(
    @CurrentUser('deliveryProfile.id') partnerId: string,
    @Query('date') date?: string,
    @Query('status') status?: string,
  ) {
    return this.deliveryService.getDeliveries(partnerId, { date, status });
  }

  @Get('deliveries/:id')
  @ApiOperation({ summary: 'Get delivery details' })
  async getDeliveryDetails(
    @CurrentUser('deliveryProfile.id') partnerId: string,
    @Param('id') id: string,
  ) {
    return this.deliveryService.getDeliveryDetails(id, partnerId);
  }

  @Patch('deliveries/:id/status')
  @ApiOperation({ summary: 'Update delivery status' })
  async updateDeliveryStatus(
    @CurrentUser('deliveryProfile.id') partnerId: string,
    @Param('id') id: string,
    @Body() body: {
      status: string;
      notes?: string;
      failedReason?: string;
      latitude?: number;
      longitude?: number;
      proofUrl?: string;
    },
  ) {
    return this.deliveryService.updateDeliveryStatus(id, partnerId, body);
  }

  @Post('deliveries/:id/attempt')
  @ApiOperation({ summary: 'Record a delivery attempt' })
  async recordDeliveryAttempt(
    @CurrentUser('deliveryProfile.id') partnerId: string,
    @Param('id') id: string,
    @Body() body: {
      status: string;
      reason?: string;
      notes?: string;
      proofUrl?: string;
      latitude?: number;
      longitude?: number;
    },
  ) {
    return this.deliveryService.recordDeliveryAttempt(id, partnerId, body);
  }

  @Get('attendance')
  @ApiOperation({ summary: 'Get attendance records' })
  async getAttendance(
    @CurrentUser('deliveryProfile.id') partnerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.deliveryService.getAttendance(partnerId, { startDate, endDate });
  }

  @Post('attendance/check-in')
  @ApiOperation({ summary: 'Check in for shift' })
  async checkIn(
    @CurrentUser('deliveryProfile.id') partnerId: string,
    @Body() body: { latitude: number; longitude: number; selfieUrl?: string },
  ) {
    return this.deliveryService.checkIn(partnerId, body);
  }

  @Post('attendance/check-out')
  @ApiOperation({ summary: 'Check out from shift' })
  async checkOut(
    @CurrentUser('deliveryProfile.id') partnerId: string,
    @Body() body: { latitude: number; longitude: number },
  ) {
    return this.deliveryService.checkOut(partnerId, body);
  }

  @Get('collections')
  @ApiOperation({ summary: 'Get collection records' })
  async getCollections(
    @CurrentUser('deliveryProfile.id') partnerId: string,
    @Query('date') date?: string,
  ) {
    return this.deliveryService.getCollections(partnerId, date);
  }

  @Patch('collections/:id/collect')
  @ApiOperation({ summary: 'Mark collection as collected' })
  async markCollectionCollected(
    @CurrentUser('deliveryProfile.id') partnerId: string,
    @Param('id') id: string,
  ) {
    return this.deliveryService.markCollectionCollected(id, partnerId);
  }

  @Get('bottle-ledger')
  @ApiOperation({ summary: 'Get bottle ledger for delivery partner' })
  async getBottleLedger(
    @CurrentUser('deliveryProfile.id') partnerId: string,
  ) {
    return this.deliveryService.getBottleLedger(partnerId);
  }
}
