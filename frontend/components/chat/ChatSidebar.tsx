"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  MessageSquareIcon,
  PanelLeftCloseIcon,
  PenSquareIcon,
  SearchIcon,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ConversationGroup } from "@/components/sidebar/ConversationGroup";
import { UserMenu } from "@/components/sidebar/UserMenu";
import { useConversationsStore } from "@/stores/conversationsStore";
import { useUiStore } from "@/stores/uiStore";
import { groupConversationsByDate } from "@/lib/utils/date";

interface ChatSidebarProps {
  onNavigate?: () => void;
  showCollapseToggle?: boolean;
}

export function ChatSidebar({ onNavigate, showCollapseToggle }: ChatSidebarProps) {
  const toggleSidebarCollapsed = useUiStore((s) => s.toggleSidebarCollapsed);
  const params = useParams<{ conversationId?: string }>();
  const activeConversationId = params?.conversationId;

  const conversations = useConversationsStore((s) => s.conversations);
  const listStatus = useConversationsStore((s) => s.listStatus);
  const listError = useConversationsStore((s) => s.listError);
  const searchQuery = useConversationsStore((s) => s.searchQuery);
  const setSearchQuery = useConversationsStore((s) => s.setSearchQuery);
  const nextCursor = useConversationsStore((s) => s.nextCursor);
  const isLoadingMore = useConversationsStore((s) => s.isLoadingMore);
  const fetchMoreConversations = useConversationsStore((s) => s.fetchMoreConversations);
  const fetchConversations = useConversationsStore((s) => s.fetchConversations);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.trim().toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  const groups = useMemo(() => groupConversationsByDate(filtered), [filtered]);

  return (
    <div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </div>
        <span className="flex-1 text-sm font-semibold">Codeles AI</span>
        {showCollapseToggle && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={toggleSidebarCollapsed}
            aria-label="Collapse sidebar"
          >
            <PanelLeftCloseIcon className="size-4" />
          </Button>
        )}
      </div>

      <div className="px-2.5 pb-2">
        <Link href="/chat" onClick={onNavigate}>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start gap-2 bg-sidebar text-sm"
          >
            <PenSquareIcon className="size-4" />
            New Chat
          </Button>
        </Link>
      </div>

      <div className="px-2.5 pb-2">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations"
            className="h-8 bg-sidebar pl-8 text-sm"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2">
        {listStatus === "loading" && (
          <div className="space-y-1.5 px-1 pt-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        )}

        {listStatus === "error" && (
          <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
            <p className="text-xs text-muted-foreground">
              {listError ?? "Could not load conversations."}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => fetchConversations()}>
              Retry
            </Button>
          </div>
        )}

        {listStatus === "loaded" && conversations.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
            <MessageSquareIcon className="size-6 text-muted-foreground/60" />
            <p className="text-xs text-muted-foreground">
              No conversations yet. Start a new chat to begin.
            </p>
          </div>
        )}

        {listStatus === "loaded" && conversations.length > 0 && filtered.length === 0 && (
          <p className="px-3 py-8 text-center text-xs text-muted-foreground">
            No conversations match &ldquo;{searchQuery}&rdquo;.
          </p>
        )}

        {listStatus === "loaded" &&
          groups.map((group) => (
            <ConversationGroup
              key={group.label}
              group={group}
              activeConversationId={activeConversationId}
              onNavigate={onNavigate}
            />
          ))}

        {listStatus === "loaded" && nextCursor && !searchQuery.trim() && (
          <div className="px-2.5 pt-2 pb-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              disabled={isLoadingMore}
              onClick={() => fetchMoreConversations()}
            >
              {isLoadingMore ? "Loading..." : "Load older conversations"}
            </Button>
          </div>
        )}
      </div>

      <div className="border-t border-sidebar-border px-1.5 py-1.5">
        <UserMenu />
      </div>
    </div>
  );
}
