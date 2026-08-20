import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Guards POST /auth/refresh: validates the httpOnly `refresh_token` cookie. */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
