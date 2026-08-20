import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { mkdirSync } from 'fs';
import { AppModule } from './app.module';
import { UPLOADS_DIR } from './common/constants';

async function bootstrap(): Promise<void> {
  mkdirSync(UPLOADS_DIR, { recursive: true });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: configService.get<string>('app.frontendUrl'),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Serve uploaded files at /api/uploads/:filename (prefix set explicitly since
  // useStaticAssets bypasses setGlobalPrefix).
  app.useStaticAssets(UPLOADS_DIR, { prefix: '/api/uploads/' });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Codeles AI API')
    .setDescription('REST/SSE API for the Codeles AI chat app')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('app.port', 4000);
  await app.listen(port);
}

bootstrap().catch((error: unknown) => {
  console.error('Fatal error during bootstrap', error);
  process.exit(1);
});
