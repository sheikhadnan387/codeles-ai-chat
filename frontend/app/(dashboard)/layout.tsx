"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PanelLeftIcon, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { useAuthStore } from "@/stores/authStore";
import { useConversationsStore } from "@/stores/conversationsStore";
import { useUiStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const initialize = useAuthStore((s) => s.initialize);
  const fetchConversations = useConversationsStore((s) => s.fetchConversations);
  const isSidebarCollapsed = useUiStore((s) => s.isSidebarCollapsed);
  const toggleSidebarCollapsed = useUiStore((s) => s.toggleSidebarCollapsed);
  const isMobileSidebarOpen = useUiStore((s) => s.isMobileSidebarOpen);
  const setMobileSidebarOpen = useUiStore((s) => s.setMobileSidebarOpen);
  const hasFetchedConversations = useRef(false);

  useEffect(() => {
    if (status === "idle") void initialize();
  }, [status, initialize]);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && !hasFetchedConversations.current) {
      hasFetchedConversations.current = true;
      void fetchConversations();
    }
  }, [status, fetchConversations]);

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex h-dvh w-full flex-col items-center justify-center gap-3 bg-background">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Sparkles className="size-5" />
        </div>
        <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground/25 border-t-foreground" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      <aside
        className={cn(
          "hidden shrink-0 overflow-hidden border-r border-sidebar-border transition-[width] duration-200 ease-in-out md:block",
          isSidebarCollapsed ? "w-0" : "w-64",
        )}
      >
        <div className="h-full w-64">
          <ChatSidebar showCollapseToggle />
        </div>
      </aside>

      {isSidebarCollapsed && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-2.5 left-2.5 z-10 hidden md:flex"
          onClick={toggleSidebarCollapsed}
          aria-label="Expand sidebar"
        >
          <PanelLeftIcon className="size-4" />
        </Button>
      )}

      <Sheet open={isMobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-72 gap-0 p-0">
          <SheetTitle className="sr-only">Conversations</SheetTitle>
          <ChatSidebar onNavigate={() => setMobileSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="flex min-w-0 flex-1 flex-col">{children}</main>

      <SettingsDialog />
    </div>
  );
}
