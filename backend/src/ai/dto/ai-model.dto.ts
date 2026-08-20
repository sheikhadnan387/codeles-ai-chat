import { ApiProperty } from '@nestjs/swagger';

export class AiModelDto {
  @ApiProperty({ example: 'gpt-4o-mini' })
  id!: string;

  @ApiProperty({ example: 'GPT-4o mini' })
  label!: string;

  @ApiProperty({ example: 'openai' })
  provider!: string;
}
