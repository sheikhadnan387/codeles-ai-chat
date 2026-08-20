import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import type { StringValue } from 'ms';
import { UsersService } from '../users/users.service';
import { PublicUserDto } from '../users/dto/public-user.dto';
import { toPublicUser } from '../users/users.mapper';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

const PASSWORD_HASH_COST = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: PublicUserDto;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_HASH_COST);
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    const tokens = await this.issueTokenPair(user);
    return { user: toPublicUser(user), ...tokens };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokenPair(user);
    return { user: toPublicUser(user), ...tokens };
  }

  async refresh(
    userId: string,
    presentedRefreshToken: string,
  ): Promise<TokenPair> {
    const user = await this.usersService.findById(userId);
    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const matches = await bcrypt.compare(
      presentedRefreshToken,
      user.refreshTokenHash,
    );
    if (!matches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.issueTokenPair(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshTokenHash(userId, null);
  }

  async getById(userId: string): Promise<User> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const genericMessage =
      'If an account exists for that email, a reset link has been sent.';
    const user = await this.usersService.findByEmail(dto.email);

    if (user) {
      const token = randomBytes(32).toString('hex');
      const tokenHash = await bcrypt.hash(token, PASSWORD_HASH_COST);
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await this.usersService.updateResetToken(user.id, tokenHash, expiresAt);

      const frontendUrl = this.configService.get<string>('app.frontendUrl');
      const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
      // No SMTP provider is configured in this project (by design) - log the would-be
      // reset link instead of pretending to send an email.
      this.logger.log(`Password reset link for ${user.email}: ${resetUrl}`);
    }

    return { message: genericMessage };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const candidates = await this.usersService.findUsersWithActiveResetToken();
    let matchedUser: User | null = null;
    for (const candidate of candidates) {
      if (
        candidate.resetTokenHash &&
        (await bcrypt.compare(dto.token, candidate.resetTokenHash))
      ) {
        matchedUser = candidate;
        break;
      }
    }

    if (!matchedUser) {
      throw new BadRequestException(
        'This reset link is invalid or has expired',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_HASH_COST);
    await this.usersService.resetPassword(matchedUser.id, passwordHash);

    return { message: 'Password updated. You can now log in.' };
  }

  private async issueTokenPair(user: User): Promise<TokenPair> {
    const payload: JwtPayload = { sub: user.id, email: user.email };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>(
        'jwt.accessExpiresIn',
      ) as StringValue,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>(
        'jwt.refreshExpiresIn',
      ) as StringValue,
    });

    const refreshTokenHash = await bcrypt.hash(
      refreshToken,
      PASSWORD_HASH_COST,
    );
    await this.usersService.updateRefreshTokenHash(user.id, refreshTokenHash);

    return { accessToken, refreshToken };
  }
}
