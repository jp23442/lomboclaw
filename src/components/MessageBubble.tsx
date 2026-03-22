"use client";

import { useState, useCallback, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChatMessage } from "@/lib/openclaw-client";
import { CodeBlock } from "./CodeBlock";
import { ThinkingBlock } from "./ThinkingBlock";
import { ToolCallRenderer } from "./ToolCallRenderer";

interface MessageBubbleProps {
  message: ChatMessage;
}

/**
 * Strips <think>/<thinking> tags from content and extracts thinking text.
 * Handles cases where the gateway didn't promote tags to blocks.
 */
function extractThinkingFromContent(content: string): { thinking: string; content: string } {
  if (!content) return { thinking: "", content: "" };

  let thinking = "";
  let visible = "";
  let remaining = content;

  const thinkRegex = /<(think(?:ing)?)>([\s\S]*?)<\/\1>/g;
  let lastIndex = 0;
  let match;

  while ((match = thinkRegex.exec(remaining)) !== null) {
    visible += remaining.slice(lastIndex, match.index);
    thinking += (thinking ? "\n" : "") + match[2];
    lastIndex = match.index + match[0].length;
  }

  visible += remaining.slice(lastIndex);
  return { thinking: thinking.trim(), content: visible.trim() };
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isError = message.state === "error";
  const isSystem = message.role === "system";
  const [copied, setCopied] = useState(false);

  // Parse think tags from content (in case gateway didn't promote them)
  const parsed = useMemo(() => {
    if (isUser || !message.content) return { thinking: "", content: message.content };
    return extractThinkingFromContent(message.content);
  }, [message.content, isUser]);

  // Combine structured thinking + extracted thinking
  const allThinking = [message.thinking, parsed.thinking].filter(Boolean).join("\n");
  const visibleContent = parsed.content;

  const copyContent = useCallback(() => {
    navigator.clipboard.writeText(visibleContent || message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [visibleContent, message.content]);

  if (isSystem && !isError) return null;

  return (
    <div
      className={`group py-5 px-4 md:px-0 ${
        isError ? "bg-red-950/20" : ""
      }`}
    >
      <div className="max-w-3xl mx-auto flex gap-4">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          ) : (
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
              isError ? "bg-red-600" : "bg-emerald-600"
            }`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Role label */}
          <div className="text-sm font-semibold text-zinc-300 mb-1">
            {isUser ? "Você" : isError ? "Erro" : "LomboClaw"}
          </div>

          {/* Thinking */}
          {allThinking && (
            <ThinkingBlock thinking={allThinking} />
          )}

          {/* Tool calls */}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {message.toolCalls.map((tool) => (
                <ToolCallRenderer key={tool.id} tool={tool} />
              ))}
            </div>
          )}

          {/* Message body */}
          {isUser ? (
            <p className="text-[0.9375rem] text-zinc-200 whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          ) : visibleContent ? (
            <div className="msg-content text-[0.9375rem] text-zinc-300 leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code: CodeBlock as never,
                }}
              >
                {visibleContent}
              </ReactMarkdown>
            </div>
          ) : !allThinking && !(message.toolCalls && message.toolCalls.length > 0) ? (
            <div className="msg-content text-[0.9375rem] text-zinc-500 italic leading-relaxed">
              Resposta vazia
            </div>
          ) : null}

          {/* Footer: usage + actions */}
          <div className="flex items-center gap-3 mt-2 empty:mt-0">
            {message.usage && (
              <span className="text-xs text-zinc-600">
                {message.usage.inputTokens + message.usage.outputTokens} tokens
              </span>
            )}
            {!isUser && visibleContent && (
              <button
                onClick={copyContent}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-zinc-300 p-1 rounded"
                title="Copiar"
              >
                {copied ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
