"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { useConversationsStore } from "@/stores/conversationsStore";
import { createConversation } from "@/lib/api/conversations";
import {
  regenerateConversationMessage,
  streamConversationMessage,
} from "@/lib/api/messages";
import { getApiErrorMessage } from "@/lib/api/client";
import type { Attachment, Message, SseEvent } from "@/types";

function buildOptimisticUserMessage(content: string, attachments: Attachment[]): Message {
  return {
    id: `temp-${uuidv4()}`,
    role: "USER",
    content,
    status: "COMPLETE",
    createdAt: new Date().toISOString(),
    attachments,
  };
}

function handleSseEvent(
  conversationId: string,
  pendingUserMessageId: string | null,
  event: SseEvent,
) {
  const store = useConversationsStore.getState();
  switch (event.type) {
    case "user_message":
      if (pendingUserMessageId) {
        store.replaceMessage(conversationId, pendingUserMessageId, event.message);
      }
      break;
    case "chunk":
      store.appendStreamChunk(event.content);
      break;
    case "title":
      store.applyTitleUpdate(conversationId, event.title);
      break;
    case "done":
      store.finalizeStream(conversationId, event.message);
      break;
    case "error":
      store.failStream(conversationId, event.message);
      break;
  }
}

export interface SendMessageParams {
  conversationId: string | null;
  model: string;
  content: string;
  attachments: Attachment[];
}

/**
 * Orchestrates the create-conversation-then-stream / regenerate flows
 * described in CONTRACT.md. Reads and writes the conversations store via
 * getState() directly (rather than subscribing) so this hook never causes
 * re-renders itself — components read the reactive bits (streaming content,
 * isSending, etc.) with their own selectors.
 */
export function useChatStream() {
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    const controller = abortControllerRef.current;
    if (!controller) return;
    // Finalize whatever content has streamed in so far into a local message
    // before aborting, so the UI doesn't lose the partial response.
    useConversationsStore.getState().stopStream();
    controller.abort();
  }, []);

  const runStream = useCallback(
    (conversationId: string, starter: (signal: AbortSignal) => Promise<void>) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      useConversationsStore.getState().startAssistantStream(conversationId);

      starter(controller.signal)
        .catch((error: unknown) => {
          if (controller.signal.aborted) return; // user pressed Stop — already finalized
          const message = getApiErrorMessage(
            error,
            "Something went wrong while generating the response.",
          );
          useConversationsStore.getState().failStream(conversationId, message);
        })
        .finally(() => {
          if (abortControllerRef.current === controller) {
            abortControllerRef.current = null;
          }
        });
    },
    [],
  );

  const send = useCallback(
    async ({ conversationId, model, content, attachments }: SendMessageParams) => {
      const store = useConversationsStore.getState();
      let targetId = conversationId;

      if (!targetId) {
        store.setIsSending(true);
        try {
          const created = await createConversation(model);
          targetId = created.id;
          store.registerCreatedConversation(created);
          router.push(`/chat/${created.id}`);
        } catch (error) {
          store.setIsSending(false);
          toast.error(getApiErrorMessage(error, "Could not start a new conversation."));
          return;
        }
      }

      const pendingUserMessage = buildOptimisticUserMessage(content, attachments);
      store.addOptimisticUserMessage(targetId, pendingUserMessage);
      store.setIsSending(false);

      const attachmentIds = attachments.map((a) => a.id);
      const finalTargetId = targetId;

      runStream(finalTargetId, (signal) =>
        streamConversationMessage({
          conversationId: finalTargetId,
          content,
          attachmentIds,
          signal,
          onEvent: (event) => handleSseEvent(finalTargetId, pendingUserMessage.id, event),
        }),
      );
    },
    [router, runStream],
  );

  const regenerate = useCallback(
    (conversationId: string) => {
      const store = useConversationsStore.getState();
      store.removeLastAssistantMessage(conversationId);
      runStream(conversationId, (signal) =>
        regenerateConversationMessage({
          conversationId,
          signal,
          onEvent: (event) => handleSseEvent(conversationId, null, event),
        }),
      );
    },
    [runStream],
  );

  return { send, regenerate, stop };
}
