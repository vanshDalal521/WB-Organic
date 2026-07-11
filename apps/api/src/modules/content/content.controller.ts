import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Public()
  @Get('banners')
  @ApiOperation({ summary: 'Get active banners' })
  async getActiveBanners() {
    return this.contentService.getActiveBanners();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_MANAGER)
  @ApiBearerAuth()
  @Get('admin/banners')
  @ApiOperation({ summary: 'Get all banners (admin)' })
  async getAllBanners(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.contentService.getAllBanners({ page, limit });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_MANAGER)
  @ApiBearerAuth()
  @Post('admin/banners')
  @ApiOperation({ summary: 'Create a banner' })
  async createBanner(@Body() body: any) {
    return this.contentService.createBanner(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_MANAGER)
  @ApiBearerAuth()
  @Put('admin/banners/:id')
  @ApiOperation({ summary: 'Update a banner' })
  async updateBanner(@Param('id') id: string, @Body() body: any) {
    return this.contentService.updateBanner(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_MANAGER)
  @ApiBearerAuth()
  @Delete('admin/banners/:id')
  @ApiOperation({ summary: 'Delete a banner' })
  async deleteBanner(@Param('id') id: string) {
    return this.contentService.deleteBanner(id);
  }

  @Public()
  @Get('farm-stories')
  @ApiOperation({ summary: 'Get active farm stories' })
  async getActiveFarmStories() {
    return this.contentService.getActiveFarmStories();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_MANAGER)
  @ApiBearerAuth()
  @Get('admin/farm-stories')
  @ApiOperation({ summary: 'Get all farm stories (admin)' })
  async getAllFarmStories(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.contentService.getAllFarmStories({ page, limit });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_MANAGER)
  @ApiBearerAuth()
  @Post('admin/farm-stories')
  @ApiOperation({ summary: 'Create a farm story' })
  async createFarmStory(@Body() body: any) {
    return this.contentService.createFarmStory(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_MANAGER)
  @ApiBearerAuth()
  @Put('admin/farm-stories/:id')
  @ApiOperation({ summary: 'Update a farm story' })
  async updateFarmStory(@Param('id') id: string, @Body() body: any) {
    return this.contentService.updateFarmStory(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_MANAGER)
  @ApiBearerAuth()
  @Delete('admin/farm-stories/:id')
  @ApiOperation({ summary: 'Delete a farm story' })
  async deleteFarmStory(@Param('id') id: string) {
    return this.contentService.deleteFarmStory(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_MANAGER)
  @ApiBearerAuth()
  @Get('admin/media')
  @ApiOperation({ summary: 'Get all media (admin)' })
  async getAllMedia(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.contentService.getAllMedia({ page, limit });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_MANAGER)
  @ApiBearerAuth()
  @Post('admin/media')
  @ApiOperation({ summary: 'Upload media' })
  async uploadMedia(@Body() body: any) {
    return this.contentService.uploadMedia(body);
  }
}
