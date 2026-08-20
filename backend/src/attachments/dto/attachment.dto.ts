import { ApiProperty } from '@nestjs/swagger';

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
