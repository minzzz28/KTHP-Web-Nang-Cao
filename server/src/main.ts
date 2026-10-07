import {
  ClassSerializerInterceptor,
  Logger,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { static as serveStatic } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { AppModule } from './app.module';
import {
  createSessionMiddleware,
  createSessionStore,
} from './common/auth/auth-session';
import { csrfProtection } from './common/auth/csrf';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { roomImageUploadDirectory } from './modules/rooms/room-image-upload';

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
  const clientUrl = configService.get<string>('CLIENT_URL') ?? 'http://localhost:5173';
  const expressApp = app.getHttpAdapter().getInstance();
  const sessionStore = createSessionStore(configService);
  await sessionStore.onReady();
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Bạn đã gửi quá nhiều yêu cầu xác thực. Vui lòng thử lại sau.',
    },
    // Fetching a CSRF token is read-only and must not consume login attempts.
    skip: (request) => request.method === 'GET',
  });

  expressApp.disable('x-powered-by');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  // Uploaded names are generated server-side and static serving is restricted
  // to this one directory; database URLs never become filesystem paths.
  app.use('/uploads', serveStatic(roomImageUploadDirectory, { index: false, fallthrough: false, maxAge: '1h' }));
  app.use(createSessionMiddleware(configService, sessionStore));
  app.use(cookieParser());
  app.enableCors({
    origin: clientUrl,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    credentials: true,
  });
  // Keep the legacy brute-force protection while AuthModule is served by Nest.
  app.use('/api/auth', authLimiter);
  app.use('/api', csrfProtection);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      exceptionFactory: (errors) => {
        const validationErrors = errors.flatMap((error) =>
          Object.values(error.constraints ?? {}).map((message) => ({
            field: error.property,
            message,
          })),
        );

        return new UnprocessableEntityException({
          message: 'Dữ liệu gửi lên không hợp lệ',
          errors: validationErrors,
        });
      },
    }),
  );
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
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
