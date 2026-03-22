"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { MessageBubble } from "./MessageBubble";
import { StreamingMessage } from "./StreamingMessage";
import { ChatInput, Attachment } from "./ChatInput";
import { ModelSelector } from "./ModelSelector";
import { GatewayModel } from "@/hooks/useGatewayInfo";

interface ChatAreaProps {
  onSend: (text: string, attachments?: Attachment[]) => void;
  onAbort: () => void;
  onNewChat: () => void;
  models: GatewayModel[];
}

export function ChatArea({ onSend, onAbort, onNewChat, models }: ChatAreaProps) {
  const { sessions, activeSessionId, streaming, sidebarOpen, toggleSidebar, connectionState } = useAppStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messages = activeSession?.messages ?? [];

  // Auto-scroll
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
    <div className="flex-1 flex flex-col h-full bg-zinc-950">
      {/* Header - OpenWebUI style */}
      <header className="flex items-center gap-2 h-12 px-3 border-b border-zinc-800/50 bg-zinc-950 shrink-0">
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
            </svg>
          </button>
        )}

        {/* Model selector */}
        <ModelSelector models={models} />

        <div className="flex-1" />

        {/* Status dot */}
        <div className={`w-2 h-2 rounded-full ${statusDot}`} title={connectionState} />

        {/* New chat */}
        <button
          onClick={onNewChat}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          title="Nova conversa"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !streaming ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center mx-auto shadow-lg shadow-emerald-900/30">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
            </div>
            <h2 className="text-lg font-semibold text-zinc-200 mb-1">Como posso ajudar?</h2>
            <p className="text-sm text-zinc-600 max-w-md">
              Agente local com acesso a terminal, arquivos, browser e ferramentas.
            </p>

            {/* Quick action suggestions */}
            <div className="grid grid-cols-2 gap-2 mt-8 max-w-lg w-full">
              {[
                { icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", text: "Analisar arquivo" },
                { icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4", text: "Escrever código" },
                { icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", text: "Pesquisar na web" },
                { icon: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", text: "Rodar comando" },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => {
                    useAppStore.getState().setInputValue(item.text + ": ");
                  }}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/50 transition-colors text-sm text-left"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0">
                    <path d={item.icon} />
                  </svg>
                  {item.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-2">
            {messages.map((msg, i) => (
              <div key={msg.id}>
                {i > 0 && msg.role !== messages[i - 1]?.role && (
                  <div className="border-t border-zinc-800/30" />
                )}
                <MessageBubble message={msg} />
              </div>
            ))}
            <StreamingMessage />
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={onSend} onAbort={onAbort} />
    </div>
  );
}
