"use client";

import { useState, useEffect, useRef } from "react";

interface ThinkingBlockProps {
  thinking: string;
  isStreaming?: boolean;
  defaultOpen?: boolean;
}

export function ThinkingBlock({ thinking, isStreaming = false, defaultOpen = false }: ThinkingBlockProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll thinking content while streaming
  useEffect(() => {
    if (open && isStreaming && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [thinking, open, isStreaming]);

  // Auto-close when streaming finishes and text content starts appearing
  useEffect(() => {
    if (!isStreaming && defaultOpen) {
      setOpen(false);
    }
  }, [isStreaming, defaultOpen]);

  const wordCount = thinking.split(/\s+/).filter(Boolean).length;
  const duration = isStreaming ? "pensando..." : `${wordCount} palavras`;

  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-1 group"
      >
        {/* Brain icon */}
        <div className={`flex items-center justify-center w-5 h-5 rounded ${
          isStreaming ? "text-purple-400" : "text-zinc-500 group-hover:text-zinc-400"
        }`}>
          {isStreaming ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-pulse">
              <path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z" />
              <path d="M10 21h4M12 17v4" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z" />
              <path d="M10 21h4M12 17v4" />
            </svg>
          )}
        </div>

        <span className={isStreaming ? "text-purple-400" : ""}>
          {isStreaming ? "Pensando" : "Raciocínio"}
        </span>

        {isStreaming && (
          <span className="flex gap-0.5">
            <span className="thinking-dot w-1 h-1 rounded-full bg-purple-400" />
            <span className="thinking-dot w-1 h-1 rounded-full bg-purple-400" />
            <span className="thinking-dot w-1 h-1 rounded-full bg-purple-400" />
          </span>
        )}

        {!isStreaming && (
          <span className="text-zinc-600">{duration}</span>
        )}

        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          ref={contentRef}
          className="mt-1 px-3 py-2.5 rounded-lg border-l-2 border-purple-500/30 bg-purple-950/10 max-h-64 overflow-y-auto"
        >
          <p className="text-xs text-zinc-500 whitespace-pre-wrap leading-relaxed font-mono">
            {thinking}
            {isStreaming && (
              <span className="inline-block w-0.5 h-[1em] bg-purple-400 animate-pulse ml-0.5 align-text-bottom" />
            )}
          </p>
        </div>
      )}
    </div>
  );
}
