import { ValidationPipe, VersioningType } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { GlobalExceptionFilter } from '../../src/common/filters/http-exception.filter.js';

/** Boots a real Nest app with the same request-pipeline config as main.ts, against the e2e test DB. */
export async function bootstrapTestApp(
  configureModule: (builder: TestingModuleBuilder) => TestingModuleBuilder = (b) => b,
): Promise<NestFastifyApplication> {
  const moduleRef = await configureModule(
    Test.createTestingModule({ imports: [AppModule] }),
  ).compile();

  const app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}
