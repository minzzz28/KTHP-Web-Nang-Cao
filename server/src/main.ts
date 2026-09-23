import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

function getPort(value: string | undefined): number {
  const port = Number(value ?? '4000');

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return port;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const clientUrl = configService.get<string>('CLIENT_URL');

  app.use(helmet());
  app.enableCors({
    origin: clientUrl || false,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
  );
  app.enableShutdownHooks();

  const port = getPort(configService.get<string>('PORT'));
  await app.listen(port);
  Logger.log(`Listening on port ${port}`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown startup error';
  Logger.error(message, undefined, 'Bootstrap');
  process.exitCode = 1;
});
