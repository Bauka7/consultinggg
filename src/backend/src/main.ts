import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3000;
  const frontendUrl = configService.get<string>('frontendUrl') || 'http://localhost:5173';

  // CORS
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Cookie parser
  app.use(cookieParser());

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global class serializer
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Tradewind API')
    .setDescription(
      `
      Tradewind B2B China-sourcing platform API.

      ## Business Rules
      - Client never contacts factory directly — only through consultant
      - Factory threads (kind=factory) are hidden from clients
      - Trial counter = CLOSED orders (not requests)
      - Rating warn threshold: 3.5 (banner), block threshold: 3.0 after 10 reviews
      - Reviews published only after admin approval
      - Auto-check + auto-approve consultant applications
      - Auto-assign general consultant when no specialist for category
    `,
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('refreshToken')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('consultants', 'Consultant profiles and applications')
    .addTag('factories', 'Factory management')
    .addTag('categories', 'Product categories')
    .addTag('requests', 'Sourcing requests')
    .addTag('offers', 'Offers from consultants')
    .addTag('orders', 'Order management')
    .addTag('messaging', 'Chat and messaging')
    .addTag('reviews', 'Consultant reviews')
    .addTag('invites', 'Invite system')
    .addTag('admin', 'Platform administration')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);
  console.log(`Tradewind API running on: http://localhost:${port}/api/v1`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
