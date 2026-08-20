"use client";

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { toast } from "sonner";
import { ArrowUpIcon, PaperclipIcon, SquareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AttachmentChip } from "./AttachmentChip";
import { useAutoResizeTextarea } from "@/hooks/useAutoResizeTextarea";
import { uploadAttachment } from "@/lib/api/attachments";
import { getApiErrorMessage } from "@/lib/api/client";
import type { AiModel, Attachment } from "@/types";

interface LocalAttachment {
  key: string;
  file: File;
  attachment: Attachment | null;
  isUploading: boolean;
}

export interface MessageComposerHandle {
  focus: () => void;
}

interface MessageComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (content: string, attachments: Attachment[]) => void;
  onStop: () => void;
  isStreaming: boolean;
  isSending: boolean;
  models: AiModel[];
  model: string;
  onModelChange?: (modelId: string) => void;
}

export const MessageComposer = forwardRef<MessageComposerHandle, MessageComposerProps>(
  function MessageComposer(
    { value, onChange, onSend, onStop, isStreaming, isSending, models, model, onModelChange },
    ref,
  ) {
    const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useAutoResizeTextarea(value);

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
    }));

    const isBusy = isStreaming || isSending;
    const isUploadingAny = attachments.some((a) => a.isUploading);
    const readyAttachments = attachments
      .filter((a): a is LocalAttachment & { attachment: Attachment } => a.attachment !== null);
    const canSend = (value.trim().length > 0 || readyAttachments.length > 0) && !isUploadingAny;

    const handleFiles = (files: FileList | null) => {
      if (!files || files.length === 0) return;
      Array.from(files).forEach((file) => {
        const key = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`;
        setAttachments((prev) => [...prev, { key, file, attachment: null, isUploading: true }]);

        uploadAttachment(file)
          .then((attachment) => {
            setAttachments((prev) =>
              prev.map((a) => (a.key === key ? { ...a, attachment, isUploading: false } : a)),
            );
          })
          .catch((error: unknown) => {
            toast.error(getApiErrorMessage(error, `Could not upload ${file.name}.`));
            setAttachments((prev) => prev.filter((a) => a.key !== key));
          });
      });
    };

    const removeAttachment = (key: string) => {
      setAttachments((prev) => prev.filter((a) => a.key !== key));
    };

    const handleSend = () => {
      if (!canSend || isBusy) return;
      onSend(value.trim(), readyAttachments.map((a) => a.attachment));
      setAttachments([]);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
        event.preventDefault();
        handleSend();
      }
    };

    return (
      <div className="mx-auto w-full max-w-3xl px-4 pb-4 sm:px-6">
        <div className="rounded-3xl border border-border bg-card shadow-sm">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 border-b border-border px-3 pt-3 pb-1">
              {attachments.map(({ key, file, attachment, isUploading }) => (
                <AttachmentChip
                  key={key}
                  isUploading={isUploading}
                  attachment={
                    attachment ?? {
                      fileName: file.name,
                      mimeType: file.type || "application/octet-stream",
                      fileSize: file.size,
                    }
                  }
                  onRemove={() => removeAttachment(key)}
                />
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Codeles AI..."
            rows={1}
            className="max-h-50 w-full resize-none bg-transparent px-4 py-3.5 text-[0.925rem] leading-relaxed outline-none placeholder:text-muted-foreground"
          />

          <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5">
            <div className="flex items-center gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach file"
              >
                <PaperclipIcon className="size-4" />
              </Button>

              <Select
                value={model}
                onValueChange={(value) => {
                  if (value) onModelChange?.(value);
                }}
                disabled={!onModelChange || models.length === 0}
              >
                <SelectTrigger size="sm" className="rounded-full text-xs">
                  <SelectValue placeholder="Model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isStreaming ? (
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                className="rounded-full"
                onClick={onStop}
                aria-label="Stop generating"
              >
                <SquareIcon className="size-3.5 fill-current" />
              </Button>
            ) : (
              <Button
                type="button"
                size="icon-sm"
                className="rounded-full"
                onClick={handleSend}
                disabled={!canSend || isSending}
                aria-label="Send message"
              >
                <ArrowUpIcon className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  },
);
