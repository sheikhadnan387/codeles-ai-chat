import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  JwtPayload,
  RefreshJwtUser,
} from '../interfaces/jwt-payload.interface';

function extractRefreshTokenFromCookie(req: Request): string | null {
  const cookies = req.cookies as Record<string, string | undefined> | undefined;
  return cookies?.refresh_token ?? null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('jwt.refreshSecret');
    if (!secret) {
      throw new Error('jwt.refreshSecret is not configured');
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        extractRefreshTokenFromCookie,
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload): RefreshJwtUser {
    const refreshToken = extractRefreshTokenFromCookie(req);
    if (!payload?.sub || !refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return { sub: payload.sub, email: payload.email, refreshToken };
  }
}
