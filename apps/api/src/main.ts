import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter.js';
import { AuditInterceptor } from './common/interceptors/audit.interceptor.js';

const logger = new Logger('Bootstrap');

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: process.env['NODE_ENV'] === 'development' }),
  );

  // ── Security headers ───────────────────────────────────────────────────── //
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        scriptSrc: ["'none'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: true },
    noSniff: true,
    referrerPolicy: { policy: 'no-referrer' },
    xssFilter: true,
  });

  // ── CORS — allowlist only, no wildcard ───────────────────────────────── //
  const allowedOrigins = (process.env['ALLOWED_ORIGINS'] ?? 'http://localhost:3000').split(',');
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`), false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86_400,
  });

  // ── Versioning ────────────────────────────────────────────────────────── //
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // ── Global pipes — validate + sanitize all input ─────────────────────── //
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // strip unknown properties
      forbidNonWhitelisted: true, // reject unknown properties
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // ── Global exception filter — never leak stack traces ────────────────── //
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ── Audit log interceptor ─────────────────────────────────────────────── //
  app.useGlobalInterceptors(new AuditInterceptor());

  const port = Number(process.env['PORT'] ?? 4000);
  const host = process.env['NODE_ENV'] === 'production' ? '0.0.0.0' : '127.0.0.1';

  await app.listen(port, host);
  logger.log(`API running on ${host}:${port} [${process.env['NODE_ENV'] ?? 'development'}]`);
}

bootstrap().catch((err) => {
  logger.error('Fatal error during bootstrap', err);
  process.exit(1);
});
