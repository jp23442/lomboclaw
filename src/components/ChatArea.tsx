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
      <div className="absolute top-3 md:top-6 left-0 right-0 z-40 pointer-events-none">
        <div className="flex h-14 md:h-16 items-center justify-between px-3 md:px-6 pointer-events-auto">
          <div className="flex items-center gap-2 md:gap-4">
            {!sidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="rounded-xl p-2 md:p-2.5 text-zinc-500 transition-all duration-200 hover:bg-white/[0.04] hover:text-zinc-200 hover:scale-105 active:scale-95"
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

          <div className="flex items-center gap-0.5 md:gap-1.5">
            <button className="rounded-xl p-2 md:p-2.5 text-zinc-500 transition-all duration-200 hover:bg-white/[0.04] hover:text-zinc-200" title="Status">
              <span className={`block h-2 md:h-2.5 w-2 md:w-2.5 rounded-full ${statusDot} ring-2 ring-black/50`} />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="rounded-xl p-2 md:p-2.5 text-zinc-500 transition-all duration-200 hover:bg-white/[0.04] hover:text-zinc-200"
              title="Configurações"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
              </svg>
            </button>
            <button className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-[10px] md:text-[11px] font-bold text-black shadow-lg shadow-amber-500/20 transition-all duration-200 hover:scale-105 hover:shadow-amber-500/30 active:scale-95" title="Perfil">
              JP
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !streaming ? (
          <div className="flex h-full flex-col items-center justify-center px-4 md:px-6 text-center fade-in-up pt-16 md:pt-0">
            <div className="mb-6 md:mb-10 flex flex-col md:flex-row items-center gap-4 md:gap-6">
              <div className="relative">
                <div className="flex h-14 w-14 md:h-20 md:w-20 items-center justify-center rounded-2xl md:rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-2xl shadow-emerald-500/25 float">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="md:w-8 md:h-8">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div className="absolute -inset-1 rounded-2xl md:rounded-3xl bg-emerald-500/20 blur-xl -z-10" />
              </div>
              <h1 className="text-2xl md:text-5xl font-semibold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">{currentModel}</h1>
            </div>

            <div className="w-full max-w-[920px] mb-8 md:mb-16">
              <ChatInput onSend={onSend} onAbort={onAbort} />
            </div>

            <div className="w-full max-w-[560px] text-left px-1">
              <div className="mb-4 md:mb-6 flex items-center gap-2 md:gap-3 text-sm text-zinc-500">
                <div className="flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" className="md:w-[13px] md:h-[13px]">
                    <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7Z" />
                  </svg>
                </div>
                <span className="font-medium tracking-wide text-xs md:text-sm">Sugestões</span>
              </div>
              <div className="space-y-3 md:space-y-4">
                {suggestions.map((item, index) => (
                  <button
                    key={item.title}
                    onClick={() => useAppStore.getState().setInputValue(`${item.title} ${item.subtitle}`)}
                    className="group block w-full text-left p-4 md:p-5 rounded-xl md:rounded-2xl bg-white/[0.02] border border-white/[0.04] transition-all duration-300 hover:bg-white/[0.04] hover:border-white/[0.08] active:scale-[0.99]"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="text-base md:text-lg font-semibold text-zinc-200 group-hover:text-white transition-colors">{item.title}</div>
                    <div className="text-xs md:text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors mt-1">{item.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-4xl px-3 md:px-6 py-16 md:py-12">
            {messages.map((msg, i) => (
              <div key={msg.id} className="fade-in">
                {i > 0 && msg.role !== messages[i - 1]?.role && (
                  <div className="my-5 md:my-8 border-t border-white/[0.04]" />
                )}
                <MessageBubble message={msg} />
              </div>
            ))}
            <StreamingMessage />
            <div ref={messagesEndRef} className="h-6 md:h-8" />
          </div>
        )}
      </div>

      {(messages.length > 0 || streaming) && <ChatInput onSend={onSend} onAbort={onAbort} />}

      {settingsOpen && <Settings clientRef={clientRef} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
