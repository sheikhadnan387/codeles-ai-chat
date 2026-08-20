"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  language: string;
  code: string;
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  const { resolvedTheme } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — silently ignore
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-border bg-[#282c34] dark:bg-[#282c34]">
      <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-3 py-1.5">
        <span className="font-mono text-xs text-white/60">{language || "text"}</span>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={handleCopy}
          className="h-6 gap-1 text-white/70 hover:bg-white/10 hover:text-white"
        >
          {copied ? (
            <>
              <CheckIcon className="size-3" />
              Copied
            </>
          ) : (
            <>
              <CopyIcon className="size-3" />
              Copy
            </>
          )}
        </Button>
      </div>
      <div className="max-w-full overflow-x-auto">
        <SyntaxHighlighter
          language={language || "text"}
          style={resolvedTheme === "light" ? oneLight : oneDark}
          customStyle={{
            margin: 0,
            padding: "0.75rem 1rem",
            background: "transparent",
            fontSize: "0.8125rem",
            lineHeight: 1.6,
          }}
          wrapLongLines={false}
        >
          {code.replace(/\n$/, "")}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
