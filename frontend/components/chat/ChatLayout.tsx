"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangleIcon, ArrowLeftIcon, SearchXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversationsStore } from "@/stores/conversationsStore";
import { useAiModels } from "@/hooks/useAiModels";
import { useChatStream } from "@/hooks/useChatStream";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import type { Attachment } from "@/types";
import { ChatHeader } from "./ChatHeader";
import { WelcomeScreen } from "./WelcomeScreen";
import { ChatMessages } from "./ChatMessages";
import { MessageComposer, type MessageComposerHandle } from "./MessageComposer";

interface ChatLayoutProps {
  conversationId?: string;
}

function ConversationSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="ml-auto w-2/3 max-w-sm space-y-2">
        <Skeleton className="ml-auto h-4 w-full rounded" />
        <Skeleton className="ml-auto h-4 w-2/3 rounded" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="size-7 shrink-0 rounded-full" />
        <div className="w-full space-y-2 pt-1">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>
      </div>
    </div>
  );
}

export function ChatLayout({ conversationId }: ChatLayoutProps) {
  const user = useAuthStore((s) => s.user);
  const activeConversation = useConversationsStore((s) => s.activeConversation);
  const activeStatus = useConversationsStore((s) => s.activeStatus);
  const activeError = useConversationsStore((s) => s.activeError);
  const streaming = useConversationsStore((s) => s.streaming);
  const streamError = useConversationsStore((s) => s.streamError);
  const isSending = useConversationsStore((s) => s.isSending);
  const loadConversation = useConversationsStore((s) => s.loadConversation);
  const clearActiveConversation = useConversationsStore((s) => s.clearActiveConversation);

  const { models } = useAiModels();
  const { send, regenerate, stop } = useChatStream();
  const preferredModelId = useUiStore((s) => s.preferredModelId);

  const [draft, setDraft] = useState("");
  // The user's explicit pick for a brand-new chat's model; falls back to the
  // preferred/first available model until they choose one themselves.
  const [selectedNewChatModel, setSelectedNewChatModel] = useState<string | null>(null);
  const composerRef = useRef<MessageComposerHandle>(null);

  const defaultNewChatModel = useMemo(() => {
    if (models.length === 0) return "";
    const preferred = models.find((m) => m.id === preferredModelId);
    return (preferred ?? models[0]).id;
  }, [models, preferredModelId]);
  const newChatModel = selectedNewChatModel ?? defaultNewChatModel;

  useEffect(() => {
    if (conversationId) {
      const current = useConversationsStore.getState().activeConversation;
      if (current?.id !== conversationId) {
        void loadConversation(conversationId);
      }
    } else {
      clearActiveConversation();
    }
    // Only re-run when navigating to a different conversation id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const currentId = conversationId ?? activeConversation?.id ?? null;
  const isStreamingCurrent = !!streaming && streaming.conversationId === currentId;
  const currentStreamError =
    streamError && streamError.conversationId === currentId ? streamError.message : null;

  const composerModel = currentId ? activeConversation?.model ?? newChatModel : newChatModel;

  const handleSelectPrompt = (prompt: string) => {
    setDraft(prompt);
    composerRef.current?.focus();
  };

  const handleSend = (content: string, attachments: Attachment[]) => {
    void send({ conversationId: currentId, model: newChatModel, content, attachments });
    setDraft("");
  };

  const handleRegenerate = () => {
    if (currentId) regenerate(currentId);
  };

  const headerTitle = useMemo(() => {
    if (currentId && activeConversation?.id === currentId) return activeConversation.title;
    return "New Chat";
  }, [currentId, activeConversation]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <ChatHeader
        title={headerTitle}
        modelLabel={
          currentId
            ? models.find((m) => m.id === activeConversation?.model)?.label
            : undefined
        }
      />

      {conversationId && activeStatus === "loading" ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ConversationSkeleton />
        </div>
      ) : conversationId && activeStatus === "not-found" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <SearchXIcon className="size-8 text-muted-foreground/60" />
          <p className="font-medium">Conversation not found</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            This conversation doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Button render={<Link href="/chat" />} variant="outline" size="sm" className="gap-1.5">
            <ArrowLeftIcon className="size-3.5" />
            Back to chat
          </Button>
        </div>
      ) : conversationId && activeStatus === "error" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <AlertTriangleIcon className="size-8 text-destructive/70" />
          <p className="font-medium">Something went wrong</p>
          <p className="max-w-sm text-sm text-muted-foreground">{activeError}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadConversation(conversationId)}
          >
            Try Again
          </Button>
        </div>
      ) : currentId ? (
        <ChatMessages
          messages={activeConversation?.messages ?? []}
          streamingContent={isStreamingCurrent ? streaming?.content ?? "" : null}
          streamErrorMessage={currentStreamError}
          isStreaming={isStreamingCurrent}
          onRegenerate={handleRegenerate}
          onTryAgain={handleRegenerate}
        />
      ) : (
        <WelcomeScreen userName={user?.name.split(" ")[0]} onSelectPrompt={handleSelectPrompt} />
      )}

      <MessageComposer
        ref={composerRef}
        value={draft}
        onChange={setDraft}
        onSend={handleSend}
        onStop={stop}
        isStreaming={isStreamingCurrent}
        isSending={isSending}
        models={models}
        model={composerModel ?? ""}
        onModelChange={currentId ? undefined : setSelectedNewChatModel}
      />
    </div>
  );
}
