import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('profile')
  @ApiOperation({ summary: 'Get customer profile' })
  async getProfile(@CurrentUser('customerProfile.id') customerId: string) {
    return this.customersService.getProfile(customerId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('profile')
  @ApiOperation({ summary: 'Update customer profile' })
  async updateProfile(
    @CurrentUser('customerProfile.id') customerId: string,
    @Body() body: any,
  ) {
    return this.customersService.updateProfile(customerId, body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('addresses')
  @ApiOperation({ summary: 'Get customer addresses' })
  async getAddresses(@CurrentUser('customerProfile.id') customerId: string) {
    return this.customersService.getAddresses(customerId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('addresses')
  @ApiOperation({ summary: 'Update customer addresses' })
  async updateAddresses(
    @CurrentUser('customerProfile.id') customerId: string,
    @Body() body: any,
  ) {
    return this.customersService.updateAddresses(customerId, body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('referral')
  @ApiOperation({ summary: 'Get referral info' })
  async getReferralInfo(@CurrentUser('customerProfile.id') customerId: string) {
    return this.customersService.getReferralInfo(customerId);
  }
}
