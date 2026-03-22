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

const quickSuggestions = [
  "Mostre um snippet de código bom",
  "Me ajuda a estudar",
  "Monta um plano de ação",
  "Analisa um arquivo ou projeto",
];

export function ChatArea({ onSend, onAbort, onNewChat, models, clientRef }: ChatAreaProps) {
  const { sessions, activeSessionId, streaming, sidebarOpen, toggleSidebar, connectionState } = useAppStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messages = activeSession?.messages ?? [];

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
      <header className="flex h-14 items-center gap-3 border-b border-zinc-800/80 px-4 shrink-0">
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            title="Abrir sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
            </svg>
          </button>
        )}

        <ModelSelector models={models} clientRef={clientRef} />

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-xs text-zinc-400">
            <span className={`h-2 w-2 rounded-full ${statusDot}`} />
            {connectionState}
          </div>
          <button
            onClick={onNewChat}
            className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
            title="Nova conversa"
          >
            Nova chat
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !streaming ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-lg shadow-black/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3a9 9 0 100 18 9 9 0 000-18Z" />
                <path d="M9.5 10a1.5 1.5 0 110 3 1.5 1.5 0 010-3Zm5 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3Z" />
              </svg>
            </div>
            <h1 className="mb-2 text-3xl font-semibold tracking-tight text-zinc-100">
              {models[0]?.name || "LomboClaw"}
            </h1>
            <p className="max-w-xl text-sm text-zinc-500">
              GUI puxada pro OpenWebUI, mas com o arsenal do OpenClaw por baixo: terminal, arquivos, web, devices e ferramentas.
            </p>

            <div className="mt-8 grid w-full max-w-xl gap-3">
              {quickSuggestions.map((item) => (
                <button
                  key={item}
                  onClick={() => useAppStore.getState().setInputValue(item)}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-left text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
                >
                  <div className="mb-1 text-xs text-zinc-500">Sugestão</div>
                  <div>{item}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-4xl px-4 py-6">
            {messages.map((msg, i) => (
              <div key={msg.id}>
                {i > 0 && msg.role !== messages[i - 1]?.role && (
                  <div className="my-4 border-t border-zinc-800/40" />
                )}
                <MessageBubble message={msg} />
              </div>
            ))}
            <StreamingMessage />
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      <ChatInput onSend={onSend} onAbort={onAbort} />
    </div>
  );
}
