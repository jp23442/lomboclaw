"use client";

import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { MessageBubble } from "./MessageBubble";
import { StreamingMessage } from "./StreamingMessage";
import { ChatInput, Attachment } from "./ChatInput";
import { ModelSelector } from "./ModelSelector";
import { Settings } from "./Settings";
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
  { title: "Analise um arquivo", subtitle: "leia e explique o código" },
  { title: "Escreva um script", subtitle: "para automatizar uma tarefa" },
  { title: "Pesquise na web", subtitle: "e me traga um resumo" },
];

export function ChatArea({ onSend, onAbort, onNewChat, models, clientRef }: ChatAreaProps) {
  const { sessions, activeSessionId, streaming, sidebarOpen, toggleSidebar, connectionState } = useAppStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
    <div className="flex h-full flex-1 flex-col bg-gradient-to-b from-[#0f0f11] to-[#0c0c0e] text-zinc-100 relative">
      {/* Floating header */}
      <div className="absolute top-6 left-0 right-0 z-40 pointer-events-none">
        <div className="flex h-16 items-center justify-between px-6 pointer-events-auto">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="rounded-xl p-2.5 text-zinc-500 transition-all duration-200 hover:bg-white/[0.04] hover:text-zinc-200 hover:scale-105 active:scale-95"
                title="Abrir sidebar"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="4" y="4" width="16" height="16" rx="3" />
                  <path d="M10 4v16" />
                </svg>
              </button>
            )}
            <ModelSelector models={models} clientRef={clientRef} />
          </div>

          <div className="flex items-center gap-1.5">
            <button className="rounded-xl p-2.5 text-zinc-500 transition-all duration-200 hover:bg-white/[0.04] hover:text-zinc-200" title="Status">
              <span className={`block h-2.5 w-2.5 rounded-full ${statusDot} ring-2 ring-black/50`} />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="rounded-xl p-2.5 text-zinc-500 transition-all duration-200 hover:bg-white/[0.04] hover:text-zinc-200"
              title="Configurações"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
              </svg>
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-[11px] font-bold text-black shadow-lg shadow-amber-500/20 transition-all duration-200 hover:scale-105 hover:shadow-amber-500/30 active:scale-95" title="Perfil">
              JP
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !streaming ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center fade-in-up">
            <div className="mb-10 flex items-center gap-6">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-2xl shadow-emerald-500/25 float">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div className="absolute -inset-1 rounded-3xl bg-emerald-500/20 blur-xl -z-10" />
              </div>
              <h1 className="text-5xl font-semibold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">{currentModel}</h1>
            </div>

            <div className="w-full max-w-[920px] mb-16">
              <ChatInput onSend={onSend} onAbort={onAbort} />
            </div>

            <div className="w-full max-w-[560px] text-left">
              <div className="mb-6 flex items-center gap-3 text-sm text-zinc-500">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5">
                    <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7Z" />
                  </svg>
                </div>
                <span className="font-medium tracking-wide text-sm">Sugestões</span>
              </div>
              <div className="space-y-4">
                {suggestions.map((item, index) => (
                  <button
                    key={item.title}
                    onClick={() => useAppStore.getState().setInputValue(`${item.title} ${item.subtitle}`)}
                    className="group block w-full text-left p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] transition-all duration-300 hover:bg-white/[0.04] hover:border-white/[0.08] hover:scale-[1.01] active:scale-[0.99]"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="text-lg font-semibold text-zinc-200 group-hover:text-white transition-colors">{item.title}</div>
                    <div className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors mt-1.5">{item.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-4xl px-6 py-12">
            {messages.map((msg, i) => (
              <div key={msg.id} className="fade-in">
                {i > 0 && msg.role !== messages[i - 1]?.role && (
                  <div className="my-8 border-t border-white/[0.04]" />
                )}
                <MessageBubble message={msg} />
              </div>
            ))}
            <StreamingMessage />
            <div ref={messagesEndRef} className="h-8" />
          </div>
        )}
      </div>

      {(messages.length > 0 || streaming) && <ChatInput onSend={onSend} onAbort={onAbort} />}

      {settingsOpen && <Settings clientRef={clientRef} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
