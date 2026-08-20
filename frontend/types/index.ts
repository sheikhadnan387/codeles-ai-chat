// Mirrors the DTO shapes defined in CONTRACT.md exactly. Keep in sync with the backend.

export type MessageRole = "USER" | "ASSISTANT" | "SYSTEM";

export type MessageStatus = "PENDING" | "STREAMING" | "COMPLETE" | "ERROR";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  createdAt: string;
  attachments: Attachment[];
}

export interface ConversationSummary {
  id: string;
  title: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationDetail extends ConversationSummary {
  messages: Message[];
}

export interface PaginatedConversations {
  data: ConversationSummary[];
  nextCursor: string | null;
}

export interface AiModel {
  id: string;
  label: string;
  provider: string;
}

export interface ApiErrorShape {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

// --- SSE event protocol (POST /conversations/:id/messages, POST /conversations/:id/regenerate) ---

export interface SseUserMessageEvent {
  type: "user_message";
  message: Message;
}

export interface SseChunkEvent {
  type: "chunk";
  content: string;
}

export interface SseTitleEvent {
  type: "title";
  title: string;
}

export interface SseDoneEvent {
  type: "done";
  message: Message;
}

export interface SseErrorEvent {
  type: "error";
  message: string;
}

export type SseEvent =
  | SseUserMessageEvent
  | SseChunkEvent
  | SseTitleEvent
  | SseDoneEvent
  | SseErrorEvent;

// --- Auth payloads ---

export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  confirmPassword: string;
}
