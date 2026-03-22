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
            <div className="msg-content text-[0.9375rem] text-zinc-300 leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code: CodeBlock as never,
                }}
              >
                {visibleContent}
              </ReactMarkdown>
              <span className="inline-block w-0.5 h-[1.1em] bg-emerald-500 animate-pulse ml-0.5 align-text-bottom" />
            </div>
          ) : streaming.toolCalls.length === 0 && !allThinking ? (
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
