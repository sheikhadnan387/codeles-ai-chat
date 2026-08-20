"use client";

import { FileTextIcon, FileIcon, ImageIcon, Loader2Icon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Attachment } from "@/types";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function shortMimeLabel(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "Image";
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType === "text/plain") return "Text";
  if (mimeType.includes("word") || mimeType.includes("docx")) return "Word";
  return mimeType.split("/")[1]?.toUpperCase() ?? "File";
}

function ChipIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <ImageIcon className="size-4" />;
  if (mimeType === "application/pdf" || mimeType === "text/plain")
    return <FileTextIcon className="size-4" />;
  return <FileIcon className="size-4" />;
}

interface AttachmentChipProps {
  attachment: Pick<Attachment, "fileName" | "mimeType" | "fileSize">;
  onRemove?: () => void;
  isUploading?: boolean;
}

export function AttachmentChip({ attachment, onRemove, isUploading }: AttachmentChipProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/60 py-1.5 pr-1.5 pl-2.5 text-sm">
      {isUploading ? (
        <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
      ) : (
        <ChipIcon mimeType={attachment.mimeType} />
      )}
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="max-w-[10rem] truncate font-medium">{attachment.fileName}</span>
        <span className="text-xs text-muted-foreground">
          {shortMimeLabel(attachment.mimeType)} • {formatFileSize(attachment.fileSize)}
        </span>
      </div>
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="ml-1 shrink-0 rounded-full"
          onClick={onRemove}
          aria-label={`Remove ${attachment.fileName}`}
        >
          <XIcon className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
