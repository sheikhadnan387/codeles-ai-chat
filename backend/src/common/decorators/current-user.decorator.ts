import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/** Shape attached to `req.user` by JwtStrategy after a successful Bearer auth. */
export interface RequestUser {
  id: string;
  email: string;
}

interface AuthenticatedRequest extends Request {
  user: RequestUser;
}

/** Pulls the authenticated user off the request, populated by JwtAuthGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
