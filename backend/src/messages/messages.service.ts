import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Conversation, MessageStatus } from '@prisma/client';
import { Request, Response } from 'express';
import { AiService } from '../ai/ai.service';
import { DEFAULT_CONVERSATION_TITLE } from '../common/constants';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { toMessageDto } from './messages.mapper';
import { SSE_HEADERS, SseEvent } from './sse-event.type';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async createMessageAndStream(
    conversationId: string,
    userId: string,
    dto: CreateMessageDto,
    req: Request,
    res: Response,
  ): Promise<void> {
    const conversation = await this.getOwnedConversationOrThrow(
      conversationId,
      userId,
    );

    const userMessage = await this.prisma.message.create({
      data: {
        conversationId,
        role: 'USER',
        content: dto.content,
        status: 'COMPLETE',
      },
    });

    if (dto.attachmentIds?.length) {
      // Only claim attachments that are genuinely unclaimed - prevents an attachment
      // already linked to another message from being silently reassigned.
      await this.prisma.attachment.updateMany({
        where: { id: { in: dto.attachmentIds }, messageId: null },
        data: { messageId: userMessage.id },
      });
    }

    const userMessageWithAttachments =
      await this.prisma.message.findUniqueOrThrow({
        where: { id: userMessage.id },
        include: { attachments: true },
      });

    res.writeHead(200, SSE_HEADERS);
    res.flushHeaders();
    this.send(res, {
      type: 'user_message',
      message: toMessageDto(userMessageWithAttachments),
    });

    await this.streamAssistantResponse(conversation, res, req);
  }

  async regenerateAndStream(
    conversationId: string,
    userId: string,
    req: Request,
    res: Response,
  ): Promise<void> {
    const conversation = await this.getOwnedConversationOrThrow(
      conversationId,
      userId,
    );

    const lastUserMessage = await this.prisma.message.findFirst({
      where: { conversationId, role: 'USER' },
      orderBy: { createdAt: 'desc' },
    });
    if (!lastUserMessage) {
      throw new BadRequestException(
        'There is no user message to regenerate a response for',
      );
    }

    const lastAssistantMessage = await this.prisma.message.findFirst({
      where: { conversationId, role: 'ASSISTANT' },
      orderBy: { createdAt: 'desc' },
    });
    if (lastAssistantMessage) {
      await this.prisma.message.delete({
        where: { id: lastAssistantMessage.id },
      });
    }

    res.writeHead(200, SSE_HEADERS);
    res.flushHeaders();

    await this.streamAssistantResponse(conversation, res, req);
  }

  private async getOwnedConversationOrThrow(
    conversationId: string,
    userId: string,
  ): Promise<Conversation> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }

  private send(res: Response, payload: SseEvent): void {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    }
  }

  private async streamAssistantResponse(
    conversation: Conversation,
    res: Response,
    req: Request,
  ): Promise<void> {
    const abortController = new AbortController();
    let disconnected = false;
    req.on('close', () => {
      if (!res.writableEnded) {
        disconnected = true;
        abortController.abort();
      }
    });

    const context = await this.aiService.buildConversationContext(
      conversation.id,
    );
    const messageCount = await this.prisma.message.count({
      where: { conversationId: conversation.id },
    });
    const isFirstExchange =
      messageCount === 1 && conversation.title === DEFAULT_CONVERSATION_TITLE;

    let accumulated = '';
    let hadError = false;
    let streamCompletedNaturally = false;

    try {
      for await (const delta of this.aiService.streamCompletion(
        context,
        conversation.model,
        abortController.signal,
      )) {
        accumulated += delta;
        this.send(res, { type: 'chunk', content: delta });
      }
      streamCompletedNaturally = true;
    } catch (error) {
      if (!disconnected && !abortController.signal.aborted) {
        this.logger.error(
          `AI provider error: ${error instanceof Error ? error.message : String(error)}`,
        );
        hadError = true;
        this.send(res, {
          type: 'error',
          message: 'Failed to generate a response. Please try again.',
        });
      }
      // If it was a disconnect/abort, streamCompletedNaturally stays false -> ERROR status below.
    }

    const status: MessageStatus =
      hadError || !streamCompletedNaturally ? 'ERROR' : 'COMPLETE';

    const assistantMessage = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: accumulated,
        status,
      },
      include: { attachments: true },
    });

    if (disconnected || hadError) {
      if (!res.writableEnded) {
        res.end();
      }
      return;
    }

    if (isFirstExchange) {
      try {
        const lastUserMessage = await this.prisma.message.findFirst({
          where: { conversationId: conversation.id, role: 'USER' },
          orderBy: { createdAt: 'desc' },
        });
        const title = await this.aiService.generateTitle(
          lastUserMessage?.content ?? '',
          accumulated,
        );
        await this.prisma.conversation.update({
          where: { id: conversation.id },
          data: { title },
        });
        this.send(res, { type: 'title', title });
      } catch (error) {
        this.logger.warn(
          `Skipping auto-title: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    this.send(res, { type: 'done', message: toMessageDto(assistantMessage) });
    res.end();
  }
}
