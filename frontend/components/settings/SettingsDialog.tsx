"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { LaptopIcon, Loader2Icon, MoonIcon, SunIcon, Trash2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useUiStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { useConversationsStore } from "@/stores/conversationsStore";
import { useAiModels } from "@/hooks/useAiModels";
import { getApiErrorMessage } from "@/lib/api/client";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: LaptopIcon },
] as const;

export function SettingsDialog() {
  const router = useRouter();
  const isOpen = useUiStore((s) => s.isSettingsOpen);
  const initialTab = useUiStore((s) => s.settingsInitialTab);
  const closeSettings = useUiStore((s) => s.closeSettings);
  const preferredModelId = useUiStore((s) => s.preferredModelId);
  const setPreferredModelId = useUiStore((s) => s.setPreferredModelId);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const conversationCount = useConversationsStore((s) => s.conversations.length);
  const deleteAllConversations = useConversationsStore((s) => s.deleteAllConversations);

  const { theme, setTheme } = useTheme();
  const { models, status: modelsStatus } = useAiModels();

  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      await deleteAllConversations();
      toast.success("All conversations were deleted.");
      setIsDeleteAllOpen(false);
      router.push("/chat");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not delete all conversations."));
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeSettings();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage your account, appearance and defaults.</DialogDescription>
        </DialogHeader>

        <Tabs key={isOpen ? initialTab ?? "general" : "closed"} defaultValue={initialTab ?? "general"}>
          <TabsList className="w-full">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="model">AI Model</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <p className="text-sm text-muted-foreground">{user?.name ?? "—"}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void logout().then(() => router.push("/login"));
              }}
            >
              Log out
            </Button>
          </TabsContent>

          <TabsContent value="appearance" className="pt-2">
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-2">
                {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border border-border px-3 py-3 text-xs font-medium transition-colors hover:bg-accent",
                      theme === value && "border-primary bg-accent text-accent-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="model" className="space-y-2 pt-2">
            <Label>Default model for new chats</Label>
            <p className="text-xs text-muted-foreground">
              Applies the next time you start a new conversation. Existing conversations keep
              the model they were created with.
            </p>
            {modelsStatus === "loading" ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2Icon className="size-3.5 animate-spin" />
                Loading models...
              </div>
            ) : (
              <Select
                value={preferredModelId ?? models[0]?.id}
                onValueChange={(value) => setPreferredModelId(String(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label}
                      <span className="text-muted-foreground"> · {m.provider}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </TabsContent>

          <TabsContent value="data" className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Account</Label>
              <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
            </div>
            <div className="space-y-1.5 rounded-lg border border-destructive/30 p-3">
              <p className="text-sm font-medium">Delete all conversations</p>
              <p className="text-xs text-muted-foreground">
                Permanently deletes all {conversationCount} of your conversations and their
                messages. This can&apos;t be undone.
              </p>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="gap-1.5"
                disabled={conversationCount === 0}
                onClick={() => setIsDeleteAllOpen(true)}
              >
                <Trash2Icon className="size-3.5" />
                Delete all conversations
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>

      <AlertDialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all conversations?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes every conversation in your account. This can&apos;t be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAll}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isDeletingAll}
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteAll();
              }}
            >
              {isDeletingAll ? "Deleting..." : "Delete everything"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
