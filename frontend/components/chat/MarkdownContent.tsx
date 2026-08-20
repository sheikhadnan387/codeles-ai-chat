"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./CodeBlock";

interface MarkdownContentProps {
  content: string;
}

const components: Components = {
  code(props) {
    const { className, children, ...rest } = props;
    const isInline = !className?.includes("language-");
    const match = /language-(\w+)/.exec(className ?? "");

    if (isInline) {
      return (
        <code
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
          {...rest}
        >
          {children}
        </code>
      );
    }

    return (
      <CodeBlock
        language={match?.[1] ?? ""}
        code={String(children).replace(/\n$/, "")}
      />
    );
  },
  pre(props) {
    return <>{props.children}</>;
  },
  a(props) {
    return (
      <a
        {...props}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 hover:text-primary/80"
      />
    );
  },
  table(props) {
    return (
      <div className="my-3 w-full overflow-x-auto">
        <table className="w-full border-collapse text-sm" {...props} />
      </div>
    );
  },
  th(props) {
    return (
      <th
        className="border border-border bg-muted px-3 py-1.5 text-left font-medium"
        {...props}
      />
    );
  },
  td(props) {
    return <td className="border border-border px-3 py-1.5 align-top" {...props} />;
  },
  ul(props) {
    return <ul className="my-2 ml-5 list-disc space-y-1" {...props} />;
  },
  ol(props) {
    return <ol className="my-2 ml-5 list-decimal space-y-1" {...props} />;
  },
  blockquote(props) {
    return (
      <blockquote
        className="my-2 border-l-2 border-primary/40 pl-3 text-muted-foreground italic"
        {...props}
      />
    );
  },
  h1(props) {
    return <h1 className="mt-4 mb-2 text-xl font-semibold first:mt-0" {...props} />;
  },
  h2(props) {
    return <h2 className="mt-4 mb-2 text-lg font-semibold first:mt-0" {...props} />;
  },
  h3(props) {
    return <h3 className="mt-3 mb-1.5 text-base font-semibold first:mt-0" {...props} />;
  },
  p(props) {
    return <p className="my-2 leading-relaxed first:mt-0 last:mb-0" {...props} />;
  },
  hr() {
    return <hr className="my-4 border-border" />;
  },
};

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="min-w-0 text-[0.925rem]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
