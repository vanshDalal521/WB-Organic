import { Controller, Get, Post, Put, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all products with filtering and pagination' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isFeatured') isFeatured?: boolean,
    @Query('isTrending') isTrending?: boolean,
  ) {
    return this.productsService.findAll({
      page, limit, search, categoryId, sortBy, sortOrder, isFeatured, isTrending,
    });
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Get all active categories' })
  async getCategories() {
    return this.productsService.getCategories();
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Get featured products' })
  async getFeatured() {
    return this.productsService.getFeaturedProducts();
  }

  @Public()
  @Get('trending')
  @ApiOperation({ summary: 'Get trending products' })
  async getTrending() {
    return this.productsService.getTrendingProducts();
  }

  @Public()
  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get product by ID or slug' })
  async findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.productsService.findOne(idOrSlug);
  }

  @Public()
  @Get('category/:categorySlug')
  @ApiOperation({ summary: 'Get products by category slug' })
  async findByCategory(
    @Param('categorySlug') categorySlug: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.findByCategory(categorySlug, { page, limit });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCT_MANAGER)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new product (Admin)' })
  async create(@Body() body: any) {
    return this.productsService.createProduct(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCT_MANAGER)
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: 'Update a product (Admin)' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.productsService.updateProduct(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCT_MANAGER)
  @ApiBearerAuth()
  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle product active status (Admin)' })
  async toggleStatus(@Param('id') id: string) {
    return this.productsService.toggleProductStatus(id);
  }
}
