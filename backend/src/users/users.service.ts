import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({ data });
  }

  updateRefreshTokenHash(
    id: string,
    refreshTokenHash: string | null,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { refreshTokenHash },
    });
  }

  updateResetToken(
    id: string,
    resetTokenHash: string,
    resetTokenExpiresAt: Date,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { resetTokenHash, resetTokenExpiresAt },
    });
  }

  /**
   * Reset tokens are bcrypt-hashed (per CONTRACT.md), so we can't look a user up by an
   * equality match on the hash. Instead we fetch the small set of users with a
   * currently-active reset token and let the caller bcrypt.compare against each.
   */
  findUsersWithActiveResetToken(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        resetTokenHash: { not: null },
        resetTokenExpiresAt: { gt: new Date() },
      },
    });
  }

  resetPassword(id: string, passwordHash: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
        // Invalidate any existing session so the reset can't be raced by a stolen refresh token.
        refreshTokenHash: null,
      },
    });
  }
}
