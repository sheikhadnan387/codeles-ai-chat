import { ApiProperty } from '@nestjs/swagger';
import { PublicUserDto } from '../../users/dto/public-user.dto';

export class AuthResponseDto {
  @ApiProperty({ type: PublicUserDto })
  user!: PublicUserDto;

  @ApiProperty()
  accessToken!: string;
}

export class RefreshResponseDto {
  @ApiProperty()
  accessToken!: string;
}
