import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Support')
@Controller('support')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Create a support ticket' })
  async createTicket(
    @CurrentUser('customerProfile.id') customerId: string,
    @Body() body: {
      category: string;
      subject: string;
      orderId?: string;
      subscriptionId?: string;
      priority?: string;
      message: string;
    },
  ) {
    return this.supportService.createTicket(customerId, body);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'Get customer tickets' })
  async getTickets(
    @CurrentUser('customerProfile.id') customerId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.supportService.getTickets(customerId, { page, limit, status });
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get ticket details' })
  async getTicketDetails(
    @CurrentUser('customerProfile.id') customerId: string,
    @Param('id') id: string,
  ) {
    return this.supportService.getTicketDetails(id, customerId);
  }

  @Post('tickets/:id/messages')
  @ApiOperation({ summary: 'Add message to ticket' })
  async addMessage(
    @CurrentUser('customerProfile.id') customerId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: { message: string; attachmentUrl?: string },
  ) {
    return this.supportService.addMessage(id, customerId, userId, body);
  }

  @Get('admin/tickets')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.CUSTOMER_SUPPORT)
  @ApiOperation({ summary: 'Get all tickets (admin)' })
  async getAllTickets(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('category') category?: string,
  ) {
    return this.supportService.getAllTickets({ page, limit, status, category });
  }

  @Patch('admin/tickets/:id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.CUSTOMER_SUPPORT)
  @ApiOperation({ summary: 'Update ticket status (admin)' })
  async updateTicketStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('notes') notes?: string,
  ) {
    return this.supportService.updateTicketStatus(id, status, notes);
  }
}
