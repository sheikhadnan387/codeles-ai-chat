import { ApiProperty } from '@nestjs/swagger';

export class ConversationSummaryDto {
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
}

export class PaginatedConversationsDto {
  @ApiProperty({ type: ConversationSummaryDto, isArray: true })
  data!: ConversationSummaryDto[];

  @ApiProperty({ type: String, nullable: true })
  nextCursor!: string | null;
}
