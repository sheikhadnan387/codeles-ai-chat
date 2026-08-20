"use client";

import { AlertTriangleIcon, ArrowDownIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollToBottom } from "@/hooks/useScrollToBottom";
import { AssistantMessage } from "./AssistantMessage";
import { StreamingMessage } from "./StreamingMessage";
import { UserMessage } from "./UserMessage";
import type { Message } from "@/types";

interface ChatMessagesProps {
  messages: Message[];
  streamingContent: string | null;
  streamErrorMessage: string | null;
  isStreaming: boolean;
  onRegenerate: () => void;
  onTryAgain: () => void;
}

export function ChatMessages({
  messages,
  streamingContent,
  streamErrorMessage,
  isStreaming,
  onRegenerate,
  onTryAgain,
}: ChatMessagesProps) {
  const { containerRef, showScrollButton, scrollToBottom } = useScrollToBottom<HTMLDivElement>([
    messages,
    streamingContent,
  ]);

  const lastAssistantIndex = [...messages]
    .map((m, i) => ({ m, i }))
    .reverse()
    .find(({ m }) => m.role === "ASSISTANT")?.i;

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={containerRef} className="h-full overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
          {messages.map((message, index) =>
            message.role === "USER" ? (
              <UserMessage key={message.id} message={message} />
            ) : (
              <AssistantMessage
                key={message.id}
                message={message}
                isLast={index === lastAssistantIndex && !isStreaming}
                onRegenerate={onRegenerate}
                regenerateDisabled={isStreaming}
              />
            ),
          )}

          {streamingContent !== null && <StreamingMessage content={streamingContent} />}

          {streamErrorMessage && (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div className="flex-1 text-sm">
                <p className="font-medium text-destructive">
                  Something went wrong while generating the response.
                </p>
                <p className="mt-0.5 text-muted-foreground">{streamErrorMessage}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 gap-1.5"
                  onClick={onTryAgain}
                >
                  <RotateCcwIcon className="size-3.5" />
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showScrollButton && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="absolute bottom-4 left-1/2 -translate-x-1/2 gap-1.5 rounded-full shadow-md"
          onClick={() => scrollToBottom()}
        >
          <ArrowDownIcon className="size-3.5" />
          Scroll to bottom
        </Button>
      )}
    </div>
  );
}
