import { ApiProperty } from '@nestjs/swagger';
import { MessageRole, MessageStatus } from '@prisma/client';

export class AttachmentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fileName!: string;

  @ApiProperty()
  fileUrl!: string;

  @ApiProperty()
  mimeType!: string;

  @ApiProperty()
  fileSize!: number;
}

export class MessageDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: MessageRole })
  role!: MessageRole;

  @ApiProperty()
  content!: string;

  @ApiProperty({ enum: MessageStatus })
  status!: MessageStatus;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty({ type: AttachmentDto, isArray: true })
  attachments!: AttachmentDto[];
}
