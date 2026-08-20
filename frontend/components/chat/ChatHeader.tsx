"use client";

import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUiStore } from "@/stores/uiStore";

interface ChatHeaderProps {
  title: string;
  modelLabel?: string;
}

export function ChatHeader({ title, modelLabel }: ChatHeaderProps) {
  const setMobileSidebarOpen = useUiStore((s) => s.setMobileSidebarOpen);

  return (
    <header className="flex h-13 shrink-0 items-center gap-2 border-b border-border px-3 sm:px-4">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        <MenuIcon className="size-4.5" />
      </Button>
      <h2 className="min-w-0 flex-1 truncate text-sm font-medium">{title}</h2>
      {modelLabel && (
        <Badge variant="secondary" className="hidden shrink-0 font-normal sm:inline-flex">
          {modelLabel}
        </Badge>
      )}
    </header>
  );
}
