import { Injectable, NotFoundException } from '@nestjs/common';
import { Conversation, Prisma } from '@prisma/client';
import { DEFAULT_CONVERSATION_TITLE } from '../common/constants';
import { PrismaService } from '../prisma/prisma.service';
import {
  toConversationDetailDto,
  toConversationSummaryDto,
} from './conversations.mapper';
import { ConversationDetailDto } from './dto/conversation-detail.dto';
import {
  ConversationSummaryDto,
  PaginatedConversationsDto,
} from './dto/conversation-summary.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ListConversationsQueryDto } from './dto/list-conversations-query.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';

const DEFAULT_PAGE_SIZE = 20;

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    userId: string,
    query: ListConversationsQueryDto,
  ): Promise<PaginatedConversationsDto> {
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;

    const where: Prisma.ConversationWhereInput = {
      userId,
      ...(query.q
        ? { title: { contains: query.q, mode: 'insensitive' as const } }
        : {}),
      ...(query.cursor ? { updatedAt: { lt: new Date(query.cursor) } } : {}),
    };

    const conversations = await this.prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    const nextCursor =
      conversations.length === limit
        ? conversations[conversations.length - 1].updatedAt.toISOString()
        : null;

    return { data: conversations.map(toConversationSummaryDto), nextCursor };
  }

  async create(
    userId: string,
    dto: CreateConversationDto,
  ): Promise<ConversationSummaryDto> {
    const conversation = await this.prisma.conversation.create({
      data: {
        userId,
        title: dto.title?.trim() || DEFAULT_CONVERSATION_TITLE,
        model: dto.model,
      },
    });
    return toConversationSummaryDto(conversation);
  }

  async findOneDetailed(
    userId: string,
    id: string,
  ): Promise<ConversationDetailDto> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { attachments: true },
        },
      },
    });

    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException('Conversation not found');
    }

    return toConversationDetailDto(conversation);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateConversationDto,
  ): Promise<ConversationSummaryDto> {
    await this.assertOwned(userId, id);
    const conversation = await this.prisma.conversation.update({
      where: { id },
      data: { title: dto.title },
    });
    return toConversationSummaryDto(conversation);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.assertOwned(userId, id);
    await this.prisma.conversation.delete({ where: { id } });
  }

  private async assertOwned(userId: string, id: string): Promise<Conversation> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
    });
    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }
}
