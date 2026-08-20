import { join } from 'path';

/** Matches the Conversation.title default in prisma/schema.prisma. */
export const DEFAULT_CONVERSATION_TITLE = 'New Chat';

/** 15 MB, per CONTRACT.md attachment limits. */
export const MAX_ATTACHMENT_SIZE_BYTES = 15 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/** backend/uploads - assumes the process is started with cwd = the backend project root. */
export const UPLOADS_DIR = join(process.cwd(), 'uploads');
export const UPLOADS_STATIC_PREFIX = '/api/uploads/';
