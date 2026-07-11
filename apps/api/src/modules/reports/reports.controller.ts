import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_MANAGER, UserRole.REPORT_VIEWER)
  @ApiOperation({ summary: 'Get sales report' })
  async getSalesReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('groupBy') groupBy?: string,
  ) {
    return this.reportsService.getSalesReport({ startDate, endDate, groupBy });
  }

  @Get('orders')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.REPORT_VIEWER)
  @ApiOperation({ summary: 'Get orders report' })
  async getOrdersReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('groupBy') groupBy?: string,
  ) {
    return this.reportsService.getOrdersReport({ startDate, endDate, groupBy });
  }

  @Get('customers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.REPORT_VIEWER)
  @ApiOperation({ summary: 'Get customer analytics' })
  async getCustomerAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getCustomerAnalytics({ startDate, endDate });
  }

  @Get('subscriptions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.REPORT_VIEWER)
  @ApiOperation({ summary: 'Get subscription report' })
  async getSubscriptionReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getSubscriptionReport({ startDate, endDate });
  }

  @Get('delivery-performance')
  @Roles(UserRole.SUPER_ADMIN, UserRole.DELIVERY_MANAGER, UserRole.REPORT_VIEWER)
  @ApiOperation({ summary: 'Get delivery performance report' })
  async getDeliveryPerformance(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getDeliveryPerformance({ startDate, endDate });
  }

  @Get('products')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCT_MANAGER, UserRole.REPORT_VIEWER)
  @ApiOperation({ summary: 'Get product performance report' })
  async getProductPerformance(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getProductPerformance({ startDate, endDate });
  }

  @Get('revenue')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_MANAGER, UserRole.REPORT_VIEWER)
  @ApiOperation({ summary: 'Get revenue report' })
  async getRevenueReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getRevenueReport({ startDate, endDate });
  }

  @Get('bottles')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.REPORT_VIEWER)
  @ApiOperation({ summary: 'Get bottle tracking report' })
  async getBottleReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getBottleReport({ startDate, endDate });
  }
}
