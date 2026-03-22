"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { MessageBubble } from "./MessageBubble";
import { StreamingMessage } from "./StreamingMessage";
import { ChatInput, Attachment } from "./ChatInput";
import { ModelSelector } from "./ModelSelector";
import { GatewayModel } from "@/hooks/useGatewayInfo";
import { OpenClawClient } from "@/lib/openclaw-client";

interface ChatAreaProps {
  onSend: (text: string, attachments?: Attachment[]) => void;
  onAbort: () => void;
  onNewChat: () => void;
  models: GatewayModel[];
  clientRef: React.RefObject<OpenClawClient | null>;
}

const suggestions = [
  { title: "Show me a code snippet", subtitle: "of a website's sticky header" },
  { title: "Help me study", subtitle: "vocabulary for a college entrance exam" },
  { title: "Overcome procrastination", subtitle: "give me tips" },
];

export function ChatArea({ onSend, onAbort, onNewChat, models, clientRef }: ChatAreaProps) {
  const { sessions, activeSessionId, streaming, sidebarOpen, toggleSidebar, connectionState } = useAppStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messages = activeSession?.messages ?? [];
  const currentModel = models[0]?.name || "LomboClaw";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const statusDot = {
    connected: "bg-emerald-500",
    connecting: "bg-amber-500 animate-pulse",
    disconnected: "bg-zinc-600",
    error: "bg-red-500",
  }[connectionState];

  return (
    <div className="flex h-full flex-1 flex-col bg-[#171717] text-zinc-100">
      <header className="flex h-14 items-start justify-between border-b border-zinc-900 px-5 pt-2 shrink-0">
        <div className="flex items-start gap-3">
          {!sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="mt-0.5 rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200"
              title="Abrir sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="4" width="16" height="16" rx="3" />
                <path d="M10 4v16" />
              </svg>
            </button>
          )}
          <div>
            <ModelSelector models={models} clientRef={clientRef} />
            <button className="text-sm text-zinc-500 transition hover:text-zinc-300">Set as default</button>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200" title="Status">
            <span className={`block h-2 w-2 rounded-full ${statusDot}`} />
          </button>
          <button className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200" title="Configurações">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 6h10M4 18h16M14 6l2-2 2 2M8 18l2 2 2-2" />
            </svg>
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-[11px] font-semibold text-black" title="Perfil">
            TB
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !streaming ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-13 w-13 items-center justify-center rounded-full bg-white text-black">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="8.5" />
                  <path d="M15.5 7.5v9" />
                  <path d="M8.5 12a3.5 3.5 0 107 0 3.5 3.5 0 10-7 0Z" />
                </svg>
              </div>
              <h1 className="text-[40px] font-medium tracking-tight text-zinc-100">{currentModel}</h1>
            </div>

            <div className="w-full max-w-[860px]">
              <ChatInput onSend={onSend} onAbort={onAbort} />
            </div>

            <div className="mt-9 w-full max-w-[430px] text-left">
              <div className="mb-3 flex items-center gap-2 text-sm text-zinc-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7Z" />
                </svg>
                Suggested
              </div>
              <div className="space-y-4">
                {suggestions.map((item) => (
                  <button
                    key={item.title}
                    onClick={() => useAppStore.getState().setInputValue(`${item.title} ${item.subtitle}`)}
                    className="block text-left transition hover:opacity-80"
                  >
                    <div className="text-[18px] font-semibold text-zinc-200">{item.title}</div>
                    <div className="text-sm text-zinc-500">{item.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-4xl px-4 py-6">
            {messages.map((msg, i) => (
              <div key={msg.id}>
                {i > 0 && msg.role !== messages[i - 1]?.role && (
                  <div className="my-4 border-t border-zinc-900" />
                )}
                <MessageBubble message={msg} />
              </div>
            ))}
            <StreamingMessage />
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {(messages.length > 0 || streaming) && <ChatInput onSend={onSend} onAbort={onAbort} />}
    </div>
  );
}
