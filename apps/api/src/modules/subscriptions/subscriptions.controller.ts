import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  async createSubscription(
    @CurrentUser('customerProfile.id') customerId: string,
    @Body() body: any,
  ) {
    return this.subscriptionsService.createSubscription(customerId, body);
  }

  @Get()
  @ApiOperation({ summary: 'Get customer subscriptions' })
  async getSubscriptions(
    @CurrentUser('customerProfile.id') customerId: string,
    @Query('status') status?: string,
  ) {
    return this.subscriptionsService.getSubscriptions(customerId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription details' })
  async getSubscriptionDetails(
    @CurrentUser('customerProfile.id') customerId: string,
    @Param('id') id: string,
  ) {
    return this.subscriptionsService.getSubscriptionDetails(id, customerId);
  }

  @Patch(':id/pause')
  @ApiOperation({ summary: 'Pause a subscription' })
  async pauseSubscription(
    @CurrentUser('customerProfile.id') customerId: string,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.subscriptionsService.pauseSubscription(id, customerId, reason);
  }

  @Patch(':id/resume')
  @ApiOperation({ summary: 'Resume a paused subscription' })
  async resumeSubscription(
    @CurrentUser('customerProfile.id') customerId: string,
    @Param('id') id: string,
  ) {
    return this.subscriptionsService.resumeSubscription(id, customerId);
  }

  @Patch(':id/skip')
  @ApiOperation({ summary: 'Skip next delivery of subscription' })
  async skipDelivery(
    @CurrentUser('customerProfile.id') customerId: string,
    @Param('id') id: string,
    @Body('deliveryDate') deliveryDate: string,
    @Body('reason') reason?: string,
  ) {
    return this.subscriptionsService.skipDelivery(id, customerId, deliveryDate, reason);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a subscription' })
  async cancelSubscription(
    @CurrentUser('customerProfile.id') customerId: string,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.subscriptionsService.cancelSubscription(id, customerId, reason);
  }
}
