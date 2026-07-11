import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get customer notifications' })
  async getNotifications(
    @CurrentUser('customerProfile.id') customerId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('unreadOnly') unreadOnly?: boolean,
  ) {
    return this.notificationsService.getNotifications(customerId, { page, limit, unreadOnly });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@CurrentUser('customerProfile.id') customerId: string) {
    return this.notificationsService.getUnreadCount(customerId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(
    @CurrentUser('customerProfile.id') customerId: string,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(id, customerId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser('customerProfile.id') customerId: string) {
    return this.notificationsService.markAllAsRead(customerId);
  }

  @Post('admin/send')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_MANAGER)
  @ApiOperation({ summary: 'Send notification to customers (admin)' })
  async sendNotification(@Body() body: {
    title: string;
    body: string;
    type: string;
    targetCustomerIds?: string[];
    imageUrl?: string;
    data?: any;
  }) {
    return this.notificationsService.sendNotification(body);
  }
}
