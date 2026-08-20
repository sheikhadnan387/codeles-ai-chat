import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessageRole } from '@prisma/client';
import { DEFAULT_CONVERSATION_TITLE } from '../common/constants';
import { PrismaService } from '../prisma/prisma.service';
import { AiModelConfig } from '../config/configuration';
import {
  AI_PROVIDER,
  type AiProvider,
  type ChatMessage,
  type ChatRole,
} from './providers/ai-provider.interface';

const MAX_TITLE_LENGTH = 40;
const MAX_TITLE_WORDS = 6;

function mapRoleToChatRole(role: MessageRole): ChatRole {
  switch (role) {
    case MessageRole.ASSISTANT:
      return 'assistant';
    case MessageRole.SYSTEM:
      return 'system';
    case MessageRole.USER:
    default:
      return 'user';
  }
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @Inject(AI_PROVIDER) private readonly aiProvider: AiProvider,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Loads the most recent N messages for a conversation (oldest-first) and prepends the
   * configured system prompt. N comes from config `ai.maxContextMessages` (default 20).
   */
  async buildConversationContext(
    conversationId: string,
  ): Promise<ChatMessage[]> {
    const maxContextMessages = this.configService.get<number>(
      'ai.maxContextMessages',
      20,
    );
    const systemPrompt = this.configService.get<string>('ai.systemPrompt', '');

    const recentMessagesNewestFirst = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: maxContextMessages,
    });

    const context: ChatMessage[] = [{ role: 'system', content: systemPrompt }];
    for (const message of recentMessagesNewestFirst.reverse()) {
      // Skip messages that never finished generating - they'd otherwise poison the context.
      if (message.status === 'ERROR') {
        continue;
      }
      context.push({
        role: mapRoleToChatRole(message.role),
        content: message.content,
      });
    }

    return context;
  }

  streamCompletion(
    messages: ChatMessage[],
    model: string,
    signal?: AbortSignal,
  ): AsyncIterable<string> {
    return this.aiProvider.streamResponse(messages, model, signal);
  }

  async generateTitle(
    userMessage: string,
    assistantMessage: string,
  ): Promise<string> {
    const models = this.configService.get<AiModelConfig[]>('ai.models', []);
    const titleModel =
      models[0]?.id ??
      this.configService.get<string>('ai.openaiModel', 'gpt-4o-mini');

    const prompt: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You generate short, descriptive titles for chat conversations. ' +
          `Respond with only the title text: no quotes, no trailing punctuation, at most ${MAX_TITLE_WORDS} words.`,
      },
      {
        role: 'user',
        content: `User message: ${userMessage}\nAssistant reply: ${assistantMessage}`,
      },
    ];

    try {
      const raw = await this.aiProvider.generateResponse(prompt, titleModel);
      return this.sanitizeTitle(raw);
    } catch (error) {
      this.logger.warn(
        `Title generation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return DEFAULT_CONVERSATION_TITLE;
    }
  }

  listModels(): AiModelConfig[] {
    return this.configService.get<AiModelConfig[]>('ai.models', []);
  }

  private sanitizeTitle(raw: string): string {
    let title = raw
      .trim()
      .replace(/^[\s"'“”‘’]+|[\s"'“”‘’]+$/g, '')
      .trim();
    title = title.split(/\s+/).slice(0, MAX_TITLE_WORDS).join(' ');
    if (title.length > MAX_TITLE_LENGTH) {
      title = title.slice(0, MAX_TITLE_LENGTH).trim();
    }
    return title.length > 0 ? title : DEFAULT_CONVERSATION_TITLE;
  }
}
