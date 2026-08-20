import { User } from '@prisma/client';
import { PublicUserDto } from './dto/public-user.dto';

export function toPublicUser(user: User): PublicUserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
  };
}
