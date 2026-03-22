"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAppStore } from "@/lib/store";
import { CodeBlock } from "./CodeBlock";
import { ThinkingBlock } from "./ThinkingBlock";
import { ToolCallRenderer } from "./ToolCallRenderer";

/**
 * Extracts <think>...</think> or <thinking>...</thinking> tagged content
 * from raw streaming text. Returns separated thinking and visible content.
 * Handles incomplete/still-streaming tags gracefully.
 */
function separateThinkingFromContent(raw: string): { thinking: string; content: string } {
  if (!raw) return { thinking: "", content: "" };

  let thinking = "";
  let content = "";
  let remaining = raw;

  // Process all complete <think>...</think> or <thinking>...</thinking> pairs
  const thinkRegex = /<(think(?:ing)?)>([\s\S]*?)<\/\1>/g;
  let lastIndex = 0;
  let match;

  while ((match = thinkRegex.exec(remaining)) !== null) {
    // Add text before this tag to content
    content += remaining.slice(lastIndex, match.index);
    // Add tag contents to thinking
    thinking += (thinking ? "\n" : "") + match[2];
    lastIndex = match.index + match[0].length;
  }

  // Handle remaining text after last match
  const tail = remaining.slice(lastIndex);

  // Check if there's an unclosed <think> or <thinking> tag (still streaming)
  const unclosedMatch = tail.match(/<(think(?:ing)?)>([\s\S]*)$/);
  if (unclosedMatch) {
    // Text before the unclosed tag is content
    content += tail.slice(0, unclosedMatch.index);
    // Text inside the unclosed tag is thinking (still being streamed)
    thinking += (thinking ? "\n" : "") + unclosedMatch[2];
  } else {
    content += tail;
  }

  return { thinking: thinking.trim(), content: content.trim() };
}

export function StreamingMessage() {
  const streaming = useAppStore((s) => s.streaming);

  // Parse think tags from streaming content
  const parsed = useMemo(() => {
    if (!streaming) return { thinking: "", content: "", hasTaggedThinking: false };
    const result = separateThinkingFromContent(streaming.content);
    return {
      ...result,
      hasTaggedThinking: result.thinking.length > 0,
    };
  }, [streaming?.content]);

  if (!streaming) return null;

  // Combine: structured thinking (from proper blocks) + tagged thinking (from text)
  const allThinking = [streaming.thinking, parsed.thinking].filter(Boolean).join("\n");
  const visibleContent = parsed.hasTaggedThinking ? parsed.content : streaming.content;
  const isThinkingOnly = !!allThinking && !visibleContent;

  return (
    <div className="py-8 px-4 md:px-0 fade-in">
      <div className="max-w-3xl mx-auto flex gap-6">
        {/* Avatar */}
        <div className="shrink-0 pt-1">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 glow-ring">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-zinc-400 mb-3 tracking-wide">LomboClaw</div>

          {/* Thinking block (streaming) */}
          {allThinking && (
            <ThinkingBlock thinking={allThinking} isStreaming={true} defaultOpen={isThinkingOnly} />
          )}

          {/* Tool calls */}
          {streaming.toolCalls.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {streaming.toolCalls.map((tool) => (
                <ToolCallRenderer key={tool.id} tool={tool} isStreaming={true} />
              ))}
            </div>
          )}

          {/* Streaming text (only non-thinking content) */}
          {visibleContent ? (
            <div className="msg-content text-[15px] text-zinc-300 leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code: CodeBlock as never,
                }}
              >
                {visibleContent}
              </ReactMarkdown>
              <span className="inline-block w-0.5 h-[1.1em] bg-gradient-to-t from-emerald-500 to-emerald-400 animate-pulse ml-1 align-text-bottom rounded-full shadow-lg shadow-emerald-500/50" />
            </div>
          ) : streaming.toolCalls.length === 0 && !allThinking ? (
            <div className="flex items-center gap-1.5 py-2">
              <span className="thinking-dot w-2 h-2 rounded-full bg-emerald-500/80" />
              <span className="thinking-dot w-2 h-2 rounded-full bg-emerald-500/80" />
              <span className="thinking-dot w-2 h-2 rounded-full bg-emerald-500/80" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
