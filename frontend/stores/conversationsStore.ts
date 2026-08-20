import { create } from "zustand";
import type { ConversationDetail, ConversationSummary, Message } from "@/types";
import {
  deleteConversation as deleteConversationApi,
  getConversation,
  listConversations,
  renameConversation as renameConversationApi,
} from "@/lib/api/conversations";
import { getApiErrorMessage } from "@/lib/api/client";

const PAGE_SIZE = 20;

export type ListStatus = "idle" | "loading" | "loaded" | "error";
export type ActiveStatus = "idle" | "loading" | "loaded" | "not-found" | "error";

interface StreamingState {
  conversationId: string;
  content: string;
}

interface StreamErrorState {
  conversationId: string;
  message: string;
}

interface ConversationsState {
  // --- sidebar list ---
  conversations: ConversationSummary[];
  nextCursor: string | null;
  listStatus: ListStatus;
  listError: string | null;
  isLoadingMore: boolean;
  searchQuery: string;

  // --- active conversation ---
  activeConversation: ConversationDetail | null;
  activeStatus: ActiveStatus;
  activeError: string | null;

  // --- streaming ---
  streaming: StreamingState | null;
  isSending: boolean;
  streamError: StreamErrorState | null;

  // list actions
  setSearchQuery: (query: string) => void;
  fetchConversations: () => Promise<void>;
  fetchMoreConversations: () => Promise<void>;
  registerCreatedConversation: (summary: ConversationSummary) => void;
  upsertConversationSummary: (summary: ConversationSummary) => void;
  renameConversation: (id: string, title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  deleteAllConversations: () => Promise<void>;

  // active conversation actions
  loadConversation: (id: string) => Promise<void>;
  clearActiveConversation: () => void;

  // streaming / message mutation actions
  addOptimisticUserMessage: (conversationId: string, message: Message) => void;
  replaceMessage: (conversationId: string, tempId: string, message: Message) => void;
  removeLastAssistantMessage: (conversationId: string) => void;
  startAssistantStream: (conversationId: string) => void;
  appendStreamChunk: (chunk: string) => void;
  finalizeStream: (conversationId: string, message: Message) => void;
  stopStream: () => void;
  failStream: (conversationId: string, message: string) => void;
  clearStreamError: () => void;
  applyTitleUpdate: (conversationId: string, title: string) => void;
  setIsSending: (value: boolean) => void;
}

function bumpToTop(
  list: ConversationSummary[],
  summary: ConversationSummary,
): ConversationSummary[] {
  const filtered = list.filter((c) => c.id !== summary.id);
  return [summary, ...filtered];
}

export const useConversationsStore = create<ConversationsState>((set, get) => ({
  conversations: [],
  nextCursor: null,
  listStatus: "idle",
  listError: null,
  isLoadingMore: false,
  searchQuery: "",

  activeConversation: null,
  activeStatus: "idle",
  activeError: null,

  streaming: null,
  isSending: false,
  streamError: null,

  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchConversations: async () => {
    set({ listStatus: "loading", listError: null });
    try {
      const { data, nextCursor } = await listConversations({ limit: PAGE_SIZE });
      set({ conversations: data, nextCursor, listStatus: "loaded" });
    } catch (error) {
      set({
        listStatus: "error",
        listError: getApiErrorMessage(error, "Could not load your conversations."),
      });
    }
  },

  fetchMoreConversations: async () => {
    const { nextCursor, isLoadingMore, conversations } = get();
    if (!nextCursor || isLoadingMore) return;
    set({ isLoadingMore: true });
    try {
      const { data, nextCursor: newCursor } = await listConversations({
        cursor: nextCursor,
        limit: PAGE_SIZE,
      });
      set({
        conversations: [...conversations, ...data],
        nextCursor: newCursor,
        isLoadingMore: false,
      });
    } catch {
      set({ isLoadingMore: false });
    }
  },

  registerCreatedConversation: (summary) => {
    set((state) => ({
      conversations: bumpToTop(state.conversations, summary),
      activeConversation: { ...summary, messages: [] },
      activeStatus: "loaded",
      activeError: null,
      streamError: null,
    }));
  },

  upsertConversationSummary: (summary) => {
    set((state) => ({ conversations: bumpToTop(state.conversations, summary) }));
  },

  renameConversation: async (id, title) => {
    const updated = await renameConversationApi(id, title);
    set((state) => ({
      conversations: state.conversations.map((c) => (c.id === id ? updated : c)),
      activeConversation:
        state.activeConversation?.id === id
          ? { ...state.activeConversation, title: updated.title }
          : state.activeConversation,
    }));
  },

  deleteConversation: async (id) => {
    await deleteConversationApi(id);
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      activeConversation:
        state.activeConversation?.id === id ? null : state.activeConversation,
      activeStatus: state.activeConversation?.id === id ? "idle" : state.activeStatus,
    }));
  },

  deleteAllConversations: async () => {
    // The contract has no bulk-delete endpoint, so page through everything
    // that exists, then issue real DELETE calls for each one.
    const allIds: string[] = get().conversations.map((c) => c.id);
    let cursor = get().nextCursor;
    while (cursor) {
      const page = await listConversations({ cursor, limit: PAGE_SIZE });
      allIds.push(...page.data.map((c) => c.id));
      cursor = page.nextCursor;
    }
    await Promise.all(allIds.map((id) => deleteConversationApi(id)));
    set({
      conversations: [],
      nextCursor: null,
      activeConversation: null,
      activeStatus: "idle",
      streaming: null,
      streamError: null,
    });
  },

  loadConversation: async (id) => {
    set({ activeStatus: "loading", activeError: null, activeConversation: null });
    try {
      const detail = await getConversation(id);
      set({ activeConversation: detail, activeStatus: "loaded" });
    } catch (error) {
      const isNotFound =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as { response?: { status?: number } }).response?.status === 404;
      set({
        activeStatus: isNotFound ? "not-found" : "error",
        activeError: isNotFound
          ? null
          : getApiErrorMessage(error, "Could not load this conversation."),
      });
    }
  },

  clearActiveConversation: () =>
    set({
      activeConversation: null,
      activeStatus: "idle",
      activeError: null,
      streaming: null,
      streamError: null,
    }),

  addOptimisticUserMessage: (conversationId, message) => {
    set((state) => {
      if (!state.activeConversation || state.activeConversation.id !== conversationId) {
        return state;
      }
      return {
        activeConversation: {
          ...state.activeConversation,
          messages: [...state.activeConversation.messages, message],
        },
      };
    });
  },

  replaceMessage: (conversationId, tempId, message) => {
    set((state) => {
      if (!state.activeConversation || state.activeConversation.id !== conversationId) {
        return state;
      }
      return {
        activeConversation: {
          ...state.activeConversation,
          messages: state.activeConversation.messages.map((m) =>
            m.id === tempId ? message : m,
          ),
        },
      };
    });
  },

  removeLastAssistantMessage: (conversationId) => {
    set((state) => {
      if (!state.activeConversation || state.activeConversation.id !== conversationId) {
        return state;
      }
      const messages = state.activeConversation.messages;
      const lastAssistantIndex = [...messages]
        .reverse()
        .findIndex((m) => m.role === "ASSISTANT");
      if (lastAssistantIndex === -1) return state;
      const indexToRemove = messages.length - 1 - lastAssistantIndex;
      return {
        activeConversation: {
          ...state.activeConversation,
          messages: messages.filter((_, i) => i !== indexToRemove),
        },
        streamError: null,
      };
    });
  },

  startAssistantStream: (conversationId) => {
    set({ streaming: { conversationId, content: "" }, streamError: null });
  },

  appendStreamChunk: (chunk) => {
    set((state) => {
      if (!state.streaming) return state;
      return { streaming: { ...state.streaming, content: state.streaming.content + chunk } };
    });
  },

  finalizeStream: (conversationId, message) => {
    set((state) => {
      const next: Partial<ConversationsState> = { streaming: null, isSending: false };
      if (state.activeConversation && state.activeConversation.id === conversationId) {
        next.activeConversation = {
          ...state.activeConversation,
          messages: [...state.activeConversation.messages, message],
        };
      }
      return next;
    });
  },

  stopStream: () => {
    set((state) => {
      if (!state.streaming) return state;
      const { conversationId, content } = state.streaming;
      const next: Partial<ConversationsState> = { streaming: null, isSending: false };
      if (
        content.trim().length > 0 &&
        state.activeConversation &&
        state.activeConversation.id === conversationId
      ) {
        const stoppedMessage: Message = {
          id: `temp-stopped-${Date.now()}`,
          role: "ASSISTANT",
          content,
          status: "COMPLETE",
          createdAt: new Date().toISOString(),
          attachments: [],
        };
        next.activeConversation = {
          ...state.activeConversation,
          messages: [...state.activeConversation.messages, stoppedMessage],
        };
      }
      return next;
    });
  },

  failStream: (conversationId, message) => {
    set({ streaming: null, isSending: false, streamError: { conversationId, message } });
  },

  clearStreamError: () => set({ streamError: null }),

  applyTitleUpdate: (conversationId, title) => {
    set((state) => {
      const next: Partial<ConversationsState> = {
        conversations: state.conversations.map((c) =>
          c.id === conversationId ? { ...c, title } : c,
        ),
      };
      if (state.activeConversation && state.activeConversation.id === conversationId) {
        next.activeConversation = { ...state.activeConversation, title };
      }
      return next;
    });
  },

  setIsSending: (value) => set({ isSending: value }),
}));
