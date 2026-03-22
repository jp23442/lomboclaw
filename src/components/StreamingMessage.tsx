"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAppStore } from "@/lib/store";
import { CodeBlock } from "./CodeBlock";
import { ThinkingBlock } from "./ThinkingBlock";
import { ToolCallRenderer } from "./ToolCallRenderer";

function separateThinkingFromContent(raw: string): { thinking: string; content: string } {
  if (!raw) return { thinking: "", content: "" };
  let thinking = "";
  let content = "";
  let remaining = raw;
  const thinkRegex = /<(think(?:ing)?)>([\s\S]*?)<\/\1>/g;
  let lastIndex = 0;
  let match;
  while ((match = thinkRegex.exec(remaining)) !== null) {
    content += remaining.slice(lastIndex, match.index);
    thinking += (thinking ? "\n" : "") + match[2];
    lastIndex = match.index + match[0].length;
  }
  const tail = remaining.slice(lastIndex);
  const unclosedMatch = tail.match(/<(think(?:ing)?)>([\s\S]*)$/);
  if (unclosedMatch) {
    content += tail.slice(0, unclosedMatch.index);
    thinking += (thinking ? "\n" : "") + unclosedMatch[2];
  } else {
    content += tail;
  }
  return { thinking: thinking.trim(), content: content.trim() };
}

export function StreamingMessage() {
  const streaming = useAppStore((s) => s.streaming);

  const parsed = useMemo(() => {
    if (!streaming) return { thinking: "", content: "", hasTaggedThinking: false };
    const result = separateThinkingFromContent(streaming.content);
    return { ...result, hasTaggedThinking: result.thinking.length > 0 };
  }, [streaming?.content]);

  if (!streaming) return null;

  const allThinking = [streaming.thinking, parsed.thinking].filter(Boolean).join("\n");
  const visibleContent = parsed.hasTaggedThinking ? parsed.content : streaming.content;
  const isThinkingOnly = !!allThinking && !visibleContent;

  return (
    <div className="py-3">
      <div className="flex gap-3">
        <div className="shrink-0 pt-0.5">
          <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-zinc-500 mb-1">LomboClaw</div>

          {allThinking && (
            <ThinkingBlock thinking={allThinking} isStreaming={true} defaultOpen={isThinkingOnly} />
          )}

          {streaming.toolCalls.length > 0 && (
            <div className="space-y-1 mb-2">
              {streaming.toolCalls.map((tool) => (
                <ToolCallRenderer key={tool.id} tool={tool} isStreaming={true} />
              ))}
            </div>
          )}

          {visibleContent ? (
            <div className="msg-content text-[13px] text-zinc-300 leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock as never }}>
                {visibleContent}
              </ReactMarkdown>
              <span className="inline-block w-0.5 h-[1em] bg-emerald-500 animate-pulse ml-0.5 align-text-bottom rounded-full" />
            </div>
          ) : streaming.toolCalls.length === 0 && !allThinking ? (
            <div className="flex items-center gap-1 py-1">
              <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
              <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
              <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
