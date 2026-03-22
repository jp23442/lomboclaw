"use client";

import { useState, useEffect, useRef, useMemo } from "react";

interface ThinkingBlockProps {
  thinking: string;
  isStreaming?: boolean;
  defaultOpen?: boolean;
}

function summarize(text: string): string {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return "...";
  const first = lines[0].replace(/^(##?\s*|[-*]\s*|\d+\.\s*)/, "").trim();
  return first.length > 60 ? first.slice(0, 60) + "..." : first;
}

function formatDuration(wordCount: number): string {
  const secs = Math.round(wordCount / 4);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
}

export function ThinkingBlock({ thinking, isStreaming = false, defaultOpen = false }: ThinkingBlockProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && isStreaming && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [thinking, open, isStreaming]);

  useEffect(() => {
    if (!isStreaming && defaultOpen) setOpen(false);
  }, [isStreaming, defaultOpen]);

  const wordCount = useMemo(() => thinking.split(/\s+/).filter(Boolean).length, [thinking]);
  const preview = useMemo(() => summarize(thinking), [thinking]);

  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-zinc-400 transition py-0.5 px-1.5 -ml-1.5 rounded hover:bg-zinc-800/50 w-full text-left"
      >
        <svg
          width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
          className={`shrink-0 transition-transform ${open ? "rotate-90" : ""} ${isStreaming ? "text-violet-400" : "text-zinc-600"}`}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>

        <span className={`shrink-0 font-medium ${isStreaming ? "text-violet-400" : "text-zinc-500"}`}>
          {isStreaming ? "Pensando" : "Pensou"}
        </span>

        {isStreaming ? (
          <span className="flex gap-0.5 shrink-0">
            <span className="thinking-dot w-1 h-1 rounded-full bg-violet-400" />
            <span className="thinking-dot w-1 h-1 rounded-full bg-violet-400" />
            <span className="thinking-dot w-1 h-1 rounded-full bg-violet-400" />
          </span>
        ) : (
          <>
            <span className="text-zinc-600 shrink-0">por {formatDuration(wordCount)}</span>
            {!open && <span className="text-zinc-600/50 truncate ml-1 italic">{preview}</span>}
          </>
        )}
      </button>

      {open && (
        <div
          ref={contentRef}
          className="mt-1 ml-3 pl-3 border-l border-violet-500/20 max-h-60 overflow-y-auto"
        >
          <div className="text-[11px] text-zinc-500/80 whitespace-pre-wrap leading-relaxed">
            {thinking}
            {isStreaming && (
              <span className="inline-block w-0.5 h-[1em] bg-violet-500 animate-pulse ml-0.5 align-text-bottom rounded-full" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
