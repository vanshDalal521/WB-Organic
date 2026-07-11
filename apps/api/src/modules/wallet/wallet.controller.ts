import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Get wallet balance' })
  async getWallet(@CurrentUser('customerProfile.id') customerId: string) {
    return this.walletService.getWallet(customerId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('transactions')
  @ApiOperation({ summary: 'Get wallet transaction history' })
  async getTransactions(
    @CurrentUser('customerProfile.id') customerId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
  ) {
    return this.walletService.getAllTransactions({
      page,
      limit,
      type: type as any,
      customerId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('add-money')
  @ApiOperation({ summary: 'Add money to wallet' })
  async addMoney(
    @CurrentUser('customerProfile.id') customerId: string,
    @Body('amount') amount: number,
  ) {
    return this.walletService.addMoney(customerId, amount);
  }
}
