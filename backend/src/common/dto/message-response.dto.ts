import { ApiProperty } from '@nestjs/swagger';

/** Generic `{ message: string }` envelope used by a few auth endpoints. */
export class MessageResponseDto {
  @ApiProperty()
  message!: string;
}
