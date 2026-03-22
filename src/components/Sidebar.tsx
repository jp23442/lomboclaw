"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { GatewayModel, GatewayDevice } from "@/hooks/useGatewayInfo";

interface SidebarProps {
  onNewChat: () => void;
  models: GatewayModel[];
  devices: GatewayDevice[];
  health: { status: string; uptimeMs: number; version: string } | null;
  onRefresh: () => void;
}

function formatUptime(ms: number): string {
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

type SidebarTab = "chats" | "models" | "devices";

export function Sidebar({ onNewChat, models, devices, health, onRefresh }: SidebarProps) {
  const { sessions, activeSessionId, setActiveSession, deleteSession, toggleSidebar, connectionState } = useAppStore();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<SidebarTab>("chats");

  const statusColor = {
    connected: "bg-emerald-500",
    connecting: "bg-amber-500 animate-pulse",
    disconnected: "bg-zinc-600",
    error: "bg-red-500",
  }[connectionState];

  const filtered = useMemo(
    () => (search ? sessions.filter((s) => s.title.toLowerCase().includes(search.toLowerCase())) : sessions),
    [search, sessions]
  );

  const today: typeof sessions = [];
  const yesterday: typeof sessions = [];
  const older: typeof sessions = [];
  const now = Date.now();
  const dayMs = 86400000;

  for (const s of filtered) {
    const age = now - s.updatedAt;
    if (age < dayMs) today.push(s);
    else if (age < dayMs * 2) yesterday.push(s);
    else older.push(s);
  }

  const renderSession = (session: typeof sessions[0]) => (
    <div
      key={session.id}
      className={`group flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors ${
        session.id === activeSessionId
          ? "bg-zinc-800 text-zinc-100"
          : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
      }`}
      onClick={() => setActiveSession(session.id)}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-zinc-500">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate">{session.title}</div>
        <div className="text-[10px] text-zinc-600">{timeAgo(session.updatedAt)}</div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          deleteSession(session.id);
        }}
        className="opacity-0 transition group-hover:opacity-100 rounded-lg p-1 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-200"
        title="Apagar conversa"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  const renderGroup = (label: string, items: typeof sessions) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <div className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-zinc-600">{label}</div>
        <div className="space-y-1">{items.map(renderSession)}</div>
      </div>
    );
  };

  return (
    <aside className="flex h-full w-[300px] flex-col border-r border-zinc-800 bg-[#0f0f10]">
      <div className="flex items-center justify-between px-3 pb-2 pt-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-950 shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-100">LomboClaw</div>
            <div className="text-[11px] text-zinc-500">OpenWebUI vibes, sem lombo</div>
          </div>
        </div>
        <button
          onClick={toggleSidebar}
          className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          title="Fechar sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 3v18" />
          </svg>
        </button>
      </div>

      <div className="px-3 pb-3">
        <button
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-950 transition hover:bg-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nova conversa
        </button>
      </div>

      <div className="px-3 pb-3">
        <div className="relative">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversas..."
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-9 py-2.5 text-sm text-zinc-200 outline-none transition focus:border-zinc-700"
          />
        </div>
      </div>

      <div className="px-3 pb-2">
        <div className="grid grid-cols-3 gap-1 rounded-2xl border border-zinc-800 bg-zinc-900 p-1">
          {[
            ["chats", "Chats"],
            ["models", "Modelos"],
            ["devices", "Devices"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key as SidebarTab)}
              className={`rounded-xl px-3 py-2 text-xs transition-colors ${
                tab === key ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {tab === "chats" && (
          filtered.length === 0 ? (
            <p className="py-10 text-center text-xs text-zinc-600">
              {search ? "Nada encontrado" : "Nenhuma conversa ainda"}
            </p>
          ) : (
            <>
              {renderGroup("Hoje", today)}
              {renderGroup("Ontem", yesterday)}
              {renderGroup("Anteriores", older)}
            </>
          )
        )}

        {tab === "models" && (
          <div className="space-y-2">
            {models.length === 0 ? (
              <p className="py-10 text-center text-xs text-zinc-600">Nenhum modelo carregado</p>
            ) : (
              models.map((model) => (
                <div key={model.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${model.reasoning ? "bg-violet-400" : "bg-emerald-400"}`} />
                    <div className="truncate text-sm font-medium text-zinc-200">{model.name || model.id}</div>
                  </div>
                  <div className="mt-1 truncate font-mono text-[11px] text-zinc-500">{model.id}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {model.provider && <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">{model.provider}</span>}
                    {model.reasoning && <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-300">reasoning</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "devices" && (
          <div className="space-y-2">
            {devices.length === 0 ? (
              <p className="py-10 text-center text-xs text-zinc-600">Nenhum device pareado</p>
            ) : (
              devices.map((device) => (
                <div key={device.deviceId + device.clientId} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <div className="truncate text-sm font-medium text-zinc-200">{device.clientId}</div>
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-500">{device.platform || "unknown platform"}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">{device.deviceId}</span>
                    {device.role && <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">{device.role}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-800 px-3 py-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />
              <span className="text-xs text-zinc-300">Gateway {health?.status || connectionState}</span>
            </div>
            <button
              onClick={onRefresh}
              className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
              title="Atualizar"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
            </button>
          </div>
          <div className="space-y-1 text-[11px] text-zinc-500">
            <div className="flex justify-between gap-2">
              <span>Versão</span>
              <span className="text-zinc-300">{health ? `v${health.version}` : "-"}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Uptime</span>
              <span className="text-zinc-300">{health ? formatUptime(health.uptimeMs) : "-"}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Modelos</span>
              <span className="text-zinc-300">{models.length}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
