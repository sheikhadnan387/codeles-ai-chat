import { apiClient } from "./client";
import type {
  ConversationDetail,
  ConversationSummary,
  PaginatedConversations,
} from "@/types";

export interface ListConversationsParams {
  cursor?: string;
  limit?: number;
  q?: string;
}

export async function listConversations(
  params: ListConversationsParams = {},
): Promise<PaginatedConversations> {
  const { data } = await apiClient.get<PaginatedConversations>(
    "/conversations",
    { params },
  );
  return data;
}

export async function createConversation(
  model: string,
  title?: string,
): Promise<ConversationSummary> {
  const { data } = await apiClient.post<ConversationSummary>(
    "/conversations",
    { model, ...(title ? { title } : {}) },
  );
  return data;
}

export async function getConversation(
  id: string,
): Promise<ConversationDetail> {
  const { data } = await apiClient.get<ConversationDetail>(
    `/conversations/${id}`,
  );
  return data;
}

export async function renameConversation(
  id: string,
  title: string,
): Promise<ConversationSummary> {
  const { data } = await apiClient.patch<ConversationSummary>(
    `/conversations/${id}`,
    { title },
  );
  return data;
}

export async function deleteConversation(id: string): Promise<void> {
  await apiClient.delete(`/conversations/${id}`);
}
