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
import { LogoBox } from "./Logo";

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
    <div className="flex h-full flex-1 flex-col bg-[#111111] text-zinc-100 relative">
      {/* Header */}
      <header className="flex h-11 items-center justify-between px-3 border-b border-zinc-800/60 shrink-0">
        <div className="flex items-center gap-1.5">
          {!sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
              title="Abrir sidebar"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="4" width="16" height="16" rx="3" />
                <path d="M10 4v16" />
              </svg>
            </button>
          )}
          <ModelSelector models={models} clientRef={clientRef} />
        </div>

        <div className="flex items-center gap-0.5">
          <button className="rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-800" title="Status">
            <span className={`block h-2 w-2 rounded-full ${statusDot}`} />
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
            title="Configurações"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !streaming ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <div className="mb-5 flex items-center gap-3">
              <LogoBox size={40} className="rounded-xl shadow-lg shadow-emerald-900/30" />
              <h1 className="text-2xl font-semibold text-zinc-100">{currentModel}</h1>
            </div>

            <div className="w-full max-w-[720px] mb-8">
              <ChatInput onSend={onSend} onAbort={onAbort} />
            </div>

            <div className="w-full max-w-[420px] text-left">
              <div className="mb-3 flex items-center gap-2 text-xs text-zinc-500">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7Z" />
                </svg>
                Sugestões
              </div>
              <div className="space-y-2">
                {suggestions.map((item) => (
                  <button
                    key={item.title}
                    onClick={() => useAppStore.getState().setInputValue(`${item.title} ${item.subtitle}`)}
                    className="block w-full text-left px-3 py-2.5 rounded-lg border border-zinc-800/60 bg-zinc-900/30 transition hover:bg-zinc-800/50 hover:border-zinc-700"
                  >
                    <div className="text-sm font-medium text-zinc-200">{item.title}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{item.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl px-4 py-4">
            {messages.map((msg, i) => (
              <div key={msg.id}>
                {i > 0 && msg.role !== messages[i - 1]?.role && (
                  <div className="my-3 border-t border-zinc-800/40" />
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

      {settingsOpen && <Settings clientRef={clientRef} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
