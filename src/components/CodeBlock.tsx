"use client";

import { useState, useCallback } from "react";

interface CodeBlockProps {
  children?: React.ReactNode;
  className?: string;
  inline?: boolean;
  node?: unknown;
}

export function CodeBlock({ children, className, ...rest }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";

  // Inline code
  const isInline = !className && typeof children === "string" && !children.includes("\n");
  if (isInline) {
    return <code className={className} {...rest}>{children}</code>;
  }

  const codeString = String(children).replace(/\n$/, "");

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [codeString]);

  return (
    <div className="relative group/code my-3">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-t-lg border-b-0">
        <span className="text-xs text-zinc-500 font-mono">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Copiado!
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Copiar
            </>
          )}
        </button>
      </div>
      {/* Code content */}
      <pre className="!mt-0 !rounded-t-none !border-t-0">
        <code className={className}>{codeString}</code>
      </pre>
    </div>
  );
}
