import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Place a new order' })
  async createOrder(
    @CurrentUser('customerProfile.id') customerId: string,
    @Body() body: any,
  ) {
    return this.ordersService.createOrder(customerId, body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Get customer orders' })
  async getOrders(
    @CurrentUser('customerProfile.id') customerId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('tab') tab?: string,
    @Query('status') status?: string,
  ) {
    return this.ordersService.getCustomerOrders(customerId, { page, limit, tab, status });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  async getOrderDetails(
    @CurrentUser('customerProfile.id') customerId: string,
    @Param('id') id: string,
  ) {
    return this.ordersService.getOrderDetails(id, customerId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Cancel an order' })
  async cancelOrder(
    @CurrentUser('customerProfile.id') customerId: string,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.ordersService.cancelOrder(id, customerId, reason);
  }
}
