import { apiBaseUrl, refreshAccessToken } from "./client";
import { useAuthStore } from "@/stores/authStore";
import type { SseEvent } from "@/types";

async function extractErrorMessage(response: Response): Promise<string> {
  let message = `Request failed with status ${response.status}`;
  try {
    const data: unknown = await response.json();
    if (
      data &&
      typeof data === "object" &&
      "message" in data &&
      (data as { message?: unknown }).message
    ) {
      const raw = (data as { message: string | string[] }).message;
      message = Array.isArray(raw) ? raw.join(" ") : raw;
    }
  } catch {
    // response wasn't JSON (or had no body) — keep the status-based message
  }
  return message;
}

function doFetch(url: string, body: unknown, token: string | null, signal: AbortSignal) {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
}

/**
 * POST /conversations/:id/messages and POST /conversations/:id/regenerate
 * stream `data: <json>\n\n` frames over a chunked text/event-stream response
 * to a POST request, so they can't use EventSource (GET-only, no custom
 * headers). We drive them with fetch() + a manual ReadableStream reader.
 *
 * These calls bypass the axios instance (fetch is required for a streaming
 * body), so the CONTRACT.md 401-refresh-retry-once behavior is reimplemented
 * here directly, sharing the same dedup'd refresh call as lib/api/client.ts.
 */
async function streamSse(
  url: string,
  body: unknown,
  onEvent: (event: SseEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  let token = useAuthStore.getState().accessToken;
  let response = await doFetch(url, body, token, signal);

  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      token = newToken;
      response = await doFetch(url, body, token, signal);
    } else if (typeof window !== "undefined") {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login";
    }
  }

  if (!response.ok || !response.body) {
    throw new Error(await extractErrorMessage(response));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const rawFrame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);

      const dataLine = rawFrame
        .split("\n")
        .find((line) => line.startsWith("data:"));

      if (dataLine) {
        const jsonStr = dataLine.slice(5).trim();
        if (jsonStr) {
          try {
            onEvent(JSON.parse(jsonStr) as SseEvent);
          } catch {
            // malformed frame — ignore and keep reading
          }
        }
      }

      boundary = buffer.indexOf("\n\n");
    }
  }
}

export interface StreamConversationMessageParams {
  conversationId: string;
  content: string;
  attachmentIds?: string[];
  onEvent: (event: SseEvent) => void;
  signal: AbortSignal;
}

export function streamConversationMessage({
  conversationId,
  content,
  attachmentIds,
  onEvent,
  signal,
}: StreamConversationMessageParams): Promise<void> {
  return streamSse(
    `${apiBaseUrl}/conversations/${conversationId}/messages`,
    { content, ...(attachmentIds?.length ? { attachmentIds } : {}) },
    onEvent,
    signal,
  );
}

export interface RegenerateConversationMessageParams {
  conversationId: string;
  onEvent: (event: SseEvent) => void;
  signal: AbortSignal;
}

export function regenerateConversationMessage({
  conversationId,
  onEvent,
  signal,
}: RegenerateConversationMessageParams): Promise<void> {
  return streamSse(
    `${apiBaseUrl}/conversations/${conversationId}/regenerate`,
    undefined,
    onEvent,
    signal,
  );
}
