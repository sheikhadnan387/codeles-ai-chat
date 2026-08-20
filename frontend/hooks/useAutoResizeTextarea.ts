"use client";

import { useEffect, useRef } from "react";

/**
 * Grows a textarea to fit its content up to `maxHeight`, after which it
 * scrolls internally. Returns a ref to attach to the <textarea>.
 */
export function useAutoResizeTextarea(value: string, maxHeight = 200) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const nextHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [value, maxHeight]);

  return textareaRef;
}
