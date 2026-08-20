import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [AiModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
