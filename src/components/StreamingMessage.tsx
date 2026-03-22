"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAppStore } from "@/lib/store";
import { CodeBlock } from "./CodeBlock";
import { ThinkingBlock } from "./ThinkingBlock";
import { ToolCallRenderer } from "./ToolCallRenderer";

export function StreamingMessage() {
  const streaming = useAppStore((s) => s.streaming);

  if (!streaming) return null;

  const isThinking = !!streaming.thinking && !streaming.content;

  return (
    <div className="py-5 px-4 md:px-0">
      <div className="max-w-3xl mx-auto flex gap-4">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-zinc-300 mb-1">LomboClaw</div>

          {/* Thinking block (streaming) */}
          {streaming.thinking && (
            <ThinkingBlock thinking={streaming.thinking} isStreaming={true} defaultOpen={isThinking} />
          )}

          {/* Tool calls */}
          {streaming.toolCalls.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {streaming.toolCalls.map((tool) => (
                <ToolCallRenderer key={tool.id} tool={tool} />
              ))}
            </div>
          )}

          {/* Streaming text */}
          {streaming.content ? (
            <div className="msg-content text-[0.9375rem] text-zinc-300 leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code: CodeBlock as never,
                }}
              >
                {streaming.content}
              </ReactMarkdown>
              <span className="inline-block w-0.5 h-[1.1em] bg-emerald-500 animate-pulse ml-0.5 align-text-bottom" />
            </div>
          ) : streaming.toolCalls.length === 0 && !streaming.thinking ? (
            <div className="flex items-center gap-1 py-1">
              <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-zinc-500" />
              <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-zinc-500" />
              <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-zinc-500" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
