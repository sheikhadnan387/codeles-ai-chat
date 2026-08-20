import { MessageDto } from './dto/message.dto';

/** Matches the SSE event protocol documented in CONTRACT.md exactly. */
export type SseEvent =
  | { type: 'user_message'; message: MessageDto }
  | { type: 'chunk'; content: string }
  | { type: 'title'; title: string }
  | { type: 'done'; message: MessageDto }
  | { type: 'error'; message: string };

export const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
} as const;
