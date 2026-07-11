import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BottlesService } from './bottles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Bottles')
@Controller('bottles')
export class BottlesController {
  constructor(private readonly bottlesService: BottlesService) {}

  @Get('types')
  @ApiOperation({ summary: 'Get all bottle types' })
  async getBottleTypes() {
    return this.bottlesService.getBottleTypes();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('ledger')
  @ApiOperation({ summary: 'Get customer bottle ledger' })
  async getCustomerLedger(@CurrentUser('customerProfile.id') customerId: string) {
    return this.bottlesService.getCustomerLedger(customerId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('transactions')
  @ApiOperation({ summary: 'Get bottle transactions' })
  async getTransactions(
    @CurrentUser('customerProfile.id') customerId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
  ) {
    return this.bottlesService.getTransactions(customerId, { page, limit, type });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiBearerAuth()
  @Get('admin/ledger')
  @ApiOperation({ summary: 'Get all customer bottle ledgers (admin)' })
  async getAllCustomerLedgers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.bottlesService.getAllCustomerLedgers({ page, limit, search });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiBearerAuth()
  @Get('admin/transactions')
  @ApiOperation({ summary: 'Get all bottle transactions (admin)' })
  async getAllTransactions(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
    @Query('customerId') customerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.bottlesService.getAllTransactions({ page, limit, type, customerId, startDate, endDate });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiBearerAuth()
  @Post('admin/adjust')
  @ApiOperation({ summary: 'Adjust bottle count (admin)' })
  async adjustBottleCount(@Body() body: {
    customerId: string;
    bottleTypeId: string;
    adjustment: number;
    reason: string;
  }) {
    return this.bottlesService.adjustBottleCount(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiBearerAuth()
  @Post('admin/reconcile')
  @ApiOperation({ summary: 'Reconcile bottle counts' })
  async reconcileBottles(@Body() body: {
    customerId: string;
    bottleTypeId: string;
    actualCount: number;
    notes?: string;
  }) {
    return this.bottlesService.reconcileBottles(body);
  }
}
