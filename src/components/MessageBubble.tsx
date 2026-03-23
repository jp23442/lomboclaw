"use client";

import { useState, useCallback, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LogoIcon } from "./Logo";
import { ChatMessage } from "@/lib/openclaw-client";
import { CodeBlock } from "./CodeBlock";
import { ThinkingBlock } from "./ThinkingBlock";
import { ToolCallRenderer } from "./ToolCallRenderer";

interface MessageBubbleProps {
  message: ChatMessage;
}

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

  const parsed = useMemo(() => {
    if (isUser || !message.content) return { thinking: "", content: message.content };
    return extractThinkingFromContent(message.content);
  }, [message.content, isUser]);

  const allThinking = [message.thinking, parsed.thinking].filter(Boolean).join("\n");
  const visibleContent = parsed.content;

  const copyContent = useCallback(() => {
    navigator.clipboard.writeText(visibleContent || message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [visibleContent, message.content]);

  if (isSystem && !isError) return null;

  return (
    <div className={`group py-3 ${isError ? "bg-red-950/10 rounded-lg" : ""}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          ) : (
            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
              isError ? "bg-red-600" : "bg-emerald-600"
            }`}>
              <LogoIcon size={12} className="text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-zinc-500 mb-1">
            {isUser ? "Você" : isError ? "Erro" : "LomboClaw"}
          </div>

          {allThinking && <ThinkingBlock thinking={allThinking} />}

          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="space-y-1 mb-2">
              {message.toolCalls.map((tool) => (
                <ToolCallRenderer key={tool.id} tool={tool} />
              ))}
            </div>
          )}

          {isUser ? (
            <p className="text-[13px] text-zinc-200 whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          ) : visibleContent ? (
            <div className="msg-content text-[13px] text-zinc-300 leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock as never }}>
                {visibleContent}
              </ReactMarkdown>
            </div>
          ) : !allThinking && !(message.toolCalls && message.toolCalls.length > 0) ? (
            <div className="text-[13px] text-zinc-500 italic">Resposta vazia</div>
          ) : null}

          <div className="flex items-center gap-2 mt-2 empty:mt-0">
            {message.usage && (
              <span className="text-[10px] text-zinc-600 px-1.5 py-0.5 rounded bg-zinc-900">
                {message.usage.inputTokens + message.usage.outputTokens} tokens
              </span>
            )}
            {!isUser && visibleContent && (
              <button
                onClick={copyContent}
                className="opacity-0 group-hover:opacity-100 transition text-zinc-500 hover:text-zinc-300 p-1 rounded hover:bg-zinc-800"
                title="Copiar"
              >
                {copied ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
