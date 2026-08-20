import { Attachment, Message } from '@prisma/client';
import { AttachmentDto, MessageDto } from './dto/message.dto';

type MessageWithAttachments = Message & { attachments: Attachment[] };

function toAttachmentDto(attachment: Attachment): AttachmentDto {
  return {
    id: attachment.id,
    fileName: attachment.fileName,
    fileUrl: attachment.fileUrl,
    mimeType: attachment.mimeType,
    fileSize: attachment.fileSize,
  };
}

export function toMessageDto(message: MessageWithAttachments): MessageDto {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    status: message.status,
    createdAt: message.createdAt.toISOString(),
    attachments: message.attachments.map(toAttachmentDto),
  };
}
