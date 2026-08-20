"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useConversationsStore } from "@/stores/conversationsStore";
import { getApiErrorMessage } from "@/lib/api/client";
import type { ConversationSummary } from "@/types";

interface ConversationItemProps {
  conversation: ConversationSummary;
  isActive: boolean;
  onNavigate?: () => void;
}

export function ConversationItem({ conversation, isActive, onNavigate }: ConversationItemProps) {
  const router = useRouter();
  const renameConversation = useConversationsStore((s) => s.renameConversation);
  const deleteConversation = useConversationsStore((s) => s.deleteConversation);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(conversation.title);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const startEditing = () => {
    setEditValue(conversation.title);
    setIsEditing(true);
  };

  const commitRename = async () => {
    const nextTitle = editValue.trim();
    if (!nextTitle || nextTitle === conversation.title) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await renameConversation(conversation.id, nextTitle.slice(0, 100));
      setIsEditing(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not rename this conversation."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void commitRename();
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteConversation(conversation.id);
      setIsDeleteOpen(false);
      if (isActive) {
        router.push("/chat");
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not delete this conversation."));
    } finally {
      setIsDeleting(false);
    }
  };

  if (isEditing) {
    return (
      <div className="px-1 py-0.5">
        <Input
          ref={inputRef}
          value={editValue}
          maxLength={100}
          disabled={isSaving}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => void commitRename()}
          className="h-8 text-sm"
        />
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "group/item relative flex items-center rounded-lg",
          isActive ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/70",
        )}
      >
        <Link
          href={`/chat/${conversation.id}`}
          onClick={onNavigate}
          className="min-w-0 flex-1 truncate px-2.5 py-2 text-sm"
          title={conversation.title}
        >
          {conversation.title}
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className={cn(
                  "mr-1 shrink-0 opacity-0 group-hover/item:opacity-100 data-popup-open:opacity-100",
                  isActive && "opacity-100",
                )}
                aria-label="Conversation options"
              />
            }
          >
            <MoreHorizontalIcon className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right">
            <DropdownMenuItem onClick={startEditing}>
              <PencilIcon className="size-3.5" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => setIsDeleteOpen(true)}>
              <Trash2Icon className="size-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{conversation.title}&rdquo; and all of its messages will be permanently
              deleted. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
