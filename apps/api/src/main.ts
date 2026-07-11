import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');

  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  const defaultOrigins = [
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:8081',
    'http://localhost:8082',
  ];
  const envOrigins = (configService.get('ALLOWED_ORIGINS') || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: [...defaultOrigins, ...envOrigins],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const config = new DocumentBuilder()
    .setTitle('WB Organic Dairy API')
    .setDescription('Pure by Nature, Healthy by Choice - Complete Dairy Delivery Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication and authorization')
    .addTag('Customers', 'Customer management')
    .addTag('Products', 'Product catalog management')
    .addTag('Orders', 'Order management')
    .addTag('Subscriptions', 'Subscription management')
    .addTag('Wallet', 'Wallet operations')
    .addTag('Payments', 'Payment processing')
    .addTag('Delivery', 'Delivery operations')
    .addTag('Bottles', 'Bottle tracking')
    .addTag('Admin', 'Admin operations')
    .addTag('Content', 'Content management')
    .addTag('Notifications', 'Notification management')
    .addTag('Support', 'Customer support')
    .addTag('Reports', 'Analytics and reports')
    .addTag('Settings', 'System settings')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('APP_PORT', 3000);
  await app.listen(port);
  console.log(`🚀 WB Organic Dairy API running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
