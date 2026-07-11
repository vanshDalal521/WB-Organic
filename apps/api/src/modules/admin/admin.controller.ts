import { Controller, Get, Post, Put, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('customers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.CUSTOMER_SUPPORT)
  @ApiOperation({ summary: 'Get all customers with filtering' })
  async getCustomers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.adminService.getCustomers({ page, limit, search, status, isActive });
  }

  @Get('customers/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.CUSTOMER_SUPPORT)
  @ApiOperation({ summary: 'Get customer details' })
  async getCustomerDetails(@Param('id') id: string) {
    return this.adminService.getCustomerDetails(id);
  }

  @Patch('customers/:id/toggle-status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.CUSTOMER_SUPPORT)
  @ApiOperation({ summary: 'Toggle customer active status' })
  async toggleCustomerStatus(@Param('id') id: string) {
    return this.adminService.toggleCustomerStatus(id);
  }

  @Get('delivery-partners')
  @Roles(UserRole.SUPER_ADMIN, UserRole.DELIVERY_MANAGER)
  @ApiOperation({ summary: 'Get all delivery partners' })
  async getDeliveryPartners(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.adminService.getDeliveryPartners({ page, limit, search });
  }

  @Post('delivery-partners')
  @Roles(UserRole.SUPER_ADMIN, UserRole.DELIVERY_MANAGER)
  @ApiOperation({ summary: 'Create a new delivery partner' })
  async createDeliveryPartner(@Body() body: any) {
    return this.adminService.createDeliveryPartner(body);
  }

  @Put('delivery-partners/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.DELIVERY_MANAGER)
  @ApiOperation({ summary: 'Update delivery partner' })
  async updateDeliveryPartner(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateDeliveryPartner(id, body);
  }

  @Patch('delivery-partners/:id/toggle-status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.DELIVERY_MANAGER)
  @ApiOperation({ summary: 'Toggle delivery partner active status' })
  async toggleDeliveryPartnerStatus(@Param('id') id: string) {
    return this.adminService.toggleDeliveryPartnerStatus(id);
  }

  @Get('admins')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all admin users' })
  async getAdmins(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getAdmins({ page, limit });
  }

  @Post('admins')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new admin user' })
  async createAdmin(@Body() body: any) {
    return this.adminService.createAdmin(body);
  }

  @Put('admins/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update admin user' })
  async updateAdmin(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateAdmin(id, body);
  }

  @Patch('admins/:id/toggle-status')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Toggle admin user active status' })
  async toggleAdminStatus(@Param('id') id: string) {
    return this.adminService.toggleAdminStatus(id);
  }

  @Get('orders')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Get all orders (admin view)' })
  async getAllOrders(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getAllOrders({ page, limit, status, search, startDate, endDate });
  }

  @Patch('orders/:id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Update order status' })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('notes') notes?: string,
  ) {
    return this.adminService.updateOrderStatus(id, status, notes);
  }

  @Get('subscriptions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Get all subscriptions (admin view)' })
  async getAllSubscriptions(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllSubscriptions({ page, limit, status });
  }
}
