import { ApiProperty } from '@nestjs/swagger';
import { MessageDto } from '../../messages/dto/message.dto';

export class ConversationDetailDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  model!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty({ type: MessageDto, isArray: true })
  messages!: MessageDto[];
}
