import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { CurrentHolderPayload } from './jwt.strategy.js';

export const CurrentHolder = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest & { user: CurrentHolderPayload }>();
    return request.user.sub;
  },
);
