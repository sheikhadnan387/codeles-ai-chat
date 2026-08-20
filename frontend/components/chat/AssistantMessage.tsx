"use client";

import { useState } from "react";
import {
  CheckIcon,
  CopyIcon,
  RotateCcwIcon,
  Sparkles,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "./MarkdownContent";
import type { Message } from "@/types";

interface AssistantMessageProps {
  message: Message;
  isLast?: boolean;
  onRegenerate?: () => void;
  regenerateDisabled?: boolean;
}

type FeedbackState = "up" | "down" | null;

export function AssistantMessage({
  message,
  isLast = false,
  onRegenerate,
  regenerateDisabled = false,
}: AssistantMessageProps) {
  const [copied, setCopied] = useState(false);
  // Local-only feedback: there's no feedback endpoint in CONTRACT.md, so this
  // gives real visual affordance without pretending to persist anywhere.
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — silently ignore
    }
  };

  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Sparkles className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        {message.status === "ERROR" ? (
          <p className="text-sm text-destructive">
            This response could not be completed.
          </p>
        ) : (
          <MarkdownContent content={message.content} />
        )}

        <div className="mt-1 flex items-center gap-0.5 text-muted-foreground">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleCopy}
                  aria-label="Copy response"
                />
              }
            >
              {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
            </TooltipTrigger>
            <TooltipContent>{copied ? "Copied" : "Copy"}</TooltipContent>
          </Tooltip>

          {isLast && onRegenerate && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={onRegenerate}
                    disabled={regenerateDisabled}
                    aria-label="Regenerate response"
                  />
                }
              >
                <RotateCcwIcon className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent>Regenerate</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Good response"
                  aria-pressed={feedback === "up"}
                  onClick={() => setFeedback((prev) => (prev === "up" ? null : "up"))}
                  className={cn(feedback === "up" && "text-primary")}
                />
              }
            >
              <ThumbsUpIcon className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>Good response</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Bad response"
                  aria-pressed={feedback === "down"}
                  onClick={() => setFeedback((prev) => (prev === "down" ? null : "down"))}
                  className={cn(feedback === "down" && "text-destructive")}
                />
              }
            >
              <ThumbsDownIcon className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>Bad response</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
