import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { CurrentIssuerPayload } from './jwt.strategy.js';

export const CurrentIssuer = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest & { user: CurrentIssuerPayload }>();
    return request.user.sub;
  },
);
