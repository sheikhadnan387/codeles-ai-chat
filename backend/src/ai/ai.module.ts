import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AI_PROVIDER } from './providers/ai-provider.interface';
import { OpenAiProvider } from './providers/openai.provider';

@Module({
  controllers: [AiController],
  providers: [AiService, { provide: AI_PROVIDER, useClass: OpenAiProvider }],
  exports: [AiService],
})
export class AiModule {}
