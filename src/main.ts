import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const configService = app.get(ConfigService);

  // Body size limit must be set before helmet/compression.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const express = require('express');
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // CORS must be enabled before helmet.
  const corsOrigins = configService.get('CORS_ORIGIN')?.split(',') || ['http://localhost:3003'];
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || corsOrigins.includes(origin) || corsOrigins.includes('*')) {
        callback(null, true);
        return;
      }

      callback(null, true); // Allow all in development; restrict in production.
    },
    credentials: configService.get('CORS_CREDENTIALS') === 'true',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(compression());

  const apiPrefix = configService.get('API_PREFIX') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalFilters(new AllExceptionsFilter());

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

  const config = new DocumentBuilder()
    .setTitle('SRV Electricals Admin API')
    .setDescription('Complete API documentation for SRV Electricals Admin Panel Backend')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'Admin authentication endpoints')
    .addTag('Electricians', 'Electrician management')
    .addTag('Dealers', 'Dealer management')
    .addTag('Products', 'Product catalog management')
    .addTag('QR Codes', 'QR code generation and management')
    .addTag('Scans', 'Scan history and tracking')
    .addTag('Redemptions', 'Redemption requests management')
    .addTag('Gifts', 'Gift products and orders')
    .addTag('Notifications', 'Push notification management')
    .addTag('Offers', 'Promotional offers')
    .addTag('Banners', 'App banner management')
    .addTag('Analytics', 'Analytics and reports')
    .addTag('Wallet', 'Wallet and transactions')
    .addTag('Finance', 'Financial operations')
    .addTag('Support', 'Customer support and enquiries')
    .addTag('Settings', 'Application settings')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/', (_req: unknown, res: { redirect: (url: string) => void }) => {
    res.redirect('/api/docs');
  });

  expressApp.use('/uploads', require('express').static(join(process.cwd(), 'uploads')));

  const port = Number(configService.get('PORT') || 3003);
  const serverHost = configService.get('SERVER_HOST') || 'localhost';
  try {
    await app.listen(port, '0.0.0.0');
  } catch (error: any) {
    if (error?.code === 'EADDRINUSE') {
      console.error(
        `Port ${port} is already in use. An SRV backend or another process is already running on this port.`,
      );
      console.error(
        `Stop the existing process on port ${port}, or change PORT in .env before starting another backend instance.`,
      );
      await app.close();
      return;
    }
    await app.close();
    throw error;
  }

  console.log(`SRV Admin backend running at http://${serverHost}:${port}`);
  console.log(`Swagger docs available at http://${serverHost}:${port}/api/docs`);
  console.log(`Environment: ${configService.get('NODE_ENV')}`);
}

bootstrap();
