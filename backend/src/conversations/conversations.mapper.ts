import { Attachment, Conversation, Message } from '@prisma/client';
import { toMessageDto } from '../messages/messages.mapper';
import { ConversationDetailDto } from './dto/conversation-detail.dto';
import { ConversationSummaryDto } from './dto/conversation-summary.dto';

export function toConversationSummaryDto(
  conversation: Conversation,
): ConversationSummaryDto {
  return {
    id: conversation.id,
    title: conversation.title,
    model: conversation.model,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
  };
}

type ConversationWithMessages = Conversation & {
  messages: Array<Message & { attachments: Attachment[] }>;
};

export function toConversationDetailDto(
  conversation: ConversationWithMessages,
): ConversationDetailDto {
  return {
    ...toConversationSummaryDto(conversation),
    messages: conversation.messages.map(toMessageDto),
  };
}
