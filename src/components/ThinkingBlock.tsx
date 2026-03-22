"use client";

import { useState, useEffect, useRef, useMemo } from "react";

interface ThinkingBlockProps {
  thinking: string;
  isStreaming?: boolean;
  defaultOpen?: boolean;
}

function summarize(text: string): string {
  // Grab the first meaningful line as a preview
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return "...";
  const first = lines[0].replace(/^(##?\s*|[-*]\s*|\d+\.\s*)/, "").trim();
  return first.length > 80 ? first.slice(0, 80) + "..." : first;
}

function formatDuration(wordCount: number): string {
  // Rough estimate: ~4 words per second thinking speed
  const secs = Math.round(wordCount / 4);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
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

  // Auto-close when streaming finishes
  useEffect(() => {
    if (!isStreaming && defaultOpen) {
      setOpen(false);
    }
  }, [isStreaming, defaultOpen]);

  const wordCount = useMemo(() => thinking.split(/\s+/).filter(Boolean).length, [thinking]);
  const preview = useMemo(() => summarize(thinking), [thinking]);

  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-[11px] text-zinc-500 hover:text-zinc-400 transition-all duration-200 py-1 px-2.5 -ml-2.5 rounded-lg hover:bg-white/[0.02] group w-full text-left"
      >
        {/* Chevron */}
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className={`shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""} ${isStreaming ? "text-violet-400" : "text-zinc-600"}`}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>

        <span className={`shrink-0 font-medium ${isStreaming ? "text-violet-400" : "text-zinc-500"}`}>
          {isStreaming ? "Pensando" : "Pensou"}
        </span>

        {isStreaming ? (
          <span className="flex gap-1 shrink-0">
            <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-violet-400" />
          </span>
        ) : (
          <>
            <span className="text-zinc-600 shrink-0">
              por {formatDuration(wordCount)}
            </span>
            {!open && (
              <span className="text-zinc-600/50 truncate ml-1 italic">
                {preview}
              </span>
            )}
          </>
        )}
      </button>

      {open && (
        <div
          ref={contentRef}
          className="mt-2 ml-4 pl-4 border-l-2 border-violet-500/20 max-h-80 overflow-y-auto thinking-expand rounded-r-lg"
        >
          <div className="text-[12px] text-zinc-500/90 whitespace-pre-wrap leading-relaxed space-y-1.5">
            {thinking.split("\n").map((line, i) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={i} className="h-2" />;
              // Headers
              if (trimmed.startsWith("## ")) {
                return <div key={i} className="text-zinc-400 font-medium mt-3 mb-1">{trimmed.replace(/^##\s*/, "")}</div>;
              }
              if (trimmed.startsWith("# ")) {
                return <div key={i} className="text-zinc-300 font-semibold mt-3 mb-1">{trimmed.replace(/^#\s*/, "")}</div>;
              }
              // Bullet points
              if (/^[-*]\s/.test(trimmed)) {
                return <div key={i} className="pl-3 text-zinc-500">{trimmed}</div>;
              }
              // Numbered items
              if (/^\d+\.\s/.test(trimmed)) {
                return <div key={i} className="pl-3 text-zinc-500">{trimmed}</div>;
              }
              return <div key={i}>{trimmed}</div>;
            })}
            {isStreaming && (
              <span className="inline-block w-0.5 h-[1em] bg-gradient-to-t from-violet-500 to-violet-400 animate-pulse ml-0.5 align-text-bottom rounded-full" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
