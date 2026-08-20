import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AiProvider, ChatMessage } from './ai-provider.interface';

@Injectable()
export class OpenAiProvider implements AiProvider {
  private readonly logger = new Logger(OpenAiProvider.name);
  private readonly client: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ai.openaiApiKey');
    // Constructing the client never fails even with an empty key - the API call itself
    // will fail with a clear error, which callers (AiService) surface as a chat error
    // rather than crashing the process. This keeps the app bootable without a key configured.
    this.client = new OpenAI({ apiKey: apiKey || 'not-configured' });
  }

  async generateResponse(
    messages: ChatMessage[],
    model: string,
  ): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    });
    return completion.choices[0]?.message?.content?.trim() ?? '';
  }

  async *streamResponse(
    messages: ChatMessage[],
    model: string,
    signal?: AbortSignal,
  ): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create(
      {
        model,
        messages: messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        stream: true,
      },
      signal ? { signal } : undefined,
    );

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield delta;
      }
    }
  }
}
