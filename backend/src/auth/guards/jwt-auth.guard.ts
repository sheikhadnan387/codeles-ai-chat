import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Guards routes with a valid `Authorization: Bearer <accessToken>` header. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
