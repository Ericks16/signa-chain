import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { FastifyRequest } from 'fastify';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditLog');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<FastifyRequest>();
    const { method, url, ip } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          this.logger.log(`${method} ${url} — ${ip} — ${ms}ms`);
        },
        error: (err: unknown) => {
          const ms = Date.now() - start;
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.warn(`${method} ${url} — ${ip} — ${ms}ms — ERROR: ${msg}`);
        },
      }),
    );
  }
}
