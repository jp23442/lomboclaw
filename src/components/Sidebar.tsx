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

type SidebarMode = "main" | "models" | "devices";

export function Sidebar({ onNewChat, models, devices, health, onRefresh }: SidebarProps) {
  const { sessions, activeSessionId, setActiveSession, deleteSession, toggleSidebar, connectionState } = useAppStore();
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<SidebarMode>("main");

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

  const navItems = [
    {
      key: "main" as SidebarMode,
      label: "New Chat",
      icon: <path d="M12 5v14M5 12h14" />,
      action: onNewChat,
    },
    {
      key: "main" as SidebarMode,
      label: "Search",
      icon: <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></>,
      action: () => setMode("main"),
    },
    {
      key: "models" as SidebarMode,
      label: "Models",
      icon: <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />,
      action: () => setMode("models"),
    },
    {
      key: "devices" as SidebarMode,
      label: "Workspace",
      icon: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
      action: () => setMode("devices"),
    },
  ];

  const renderSession = (session: typeof sessions[0]) => (
    <div
      key={session.id}
      className={`group flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-sm transition-colors ${
        session.id === activeSessionId
          ? "bg-zinc-800/80 text-zinc-100"
          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
      }`}
      onClick={() => setActiveSession(session.id)}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate">{session.title}</div>
      </div>
      <span className="shrink-0 text-[10px] text-zinc-600 group-hover:hidden">{timeAgo(session.updatedAt)}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          deleteSession(session.id);
        }}
        className="hidden rounded-lg p-1 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-200 group-hover:block"
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
      <div className="mb-5">
        <div className="mb-2 px-2 text-xs text-zinc-600">{label}</div>
        <div className="space-y-1">{items.map(renderSession)}</div>
      </div>
    );
  };

  return (
    <aside className="flex h-full w-[308px] flex-col border-r border-zinc-900 bg-[#0b0b0c] text-zinc-100">
      <div className="flex items-center justify-between px-5 pb-5 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="8.5" />
              <path d="M15.5 7.5v9" />
              <path d="M8.5 12a3.5 3.5 0 107 0 3.5 3.5 0 10-7 0Z" />
            </svg>
          </div>
          <div className="text-[15px] font-semibold text-zinc-100">Open WebUI</div>
        </div>
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
          title="Fechar sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="4" width="16" height="16" rx="3" />
            <path d="M10 4v16" />
          </svg>
        </button>
      </div>

      <div className="px-4 pb-5">
        <div className="space-y-1">
          {navItems.map((item, index) => (
            <button
              key={`${item.label}-${index}`}
              onClick={item.action}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] text-zinc-300 transition hover:bg-zinc-900 hover:text-zinc-100"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-zinc-400">
                {item.icon}
              </svg>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "main" && (
        <>
          <div className="px-4 pb-5">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats"
              className="w-full rounded-xl border border-zinc-900 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-zinc-800"
            />
          </div>

          <div className="flex-1 overflow-y-auto px-4">
            <div className="mb-5">
              <div className="mb-2 px-2 text-xs text-zinc-600">Channels</div>
              <div className="rounded-xl px-2 py-2 text-sm text-zinc-300 hover:bg-zinc-900"># general</div>
            </div>

            <div className="mb-5">
              <div className="mb-2 px-2 text-xs text-zinc-600">Folders</div>
              <div className="space-y-1">
                <div className="rounded-xl px-2 py-2 text-sm text-zinc-300 hover:bg-zinc-900">💵 Finance</div>
                <div className="rounded-xl px-2 py-2 text-sm text-zinc-300 hover:bg-zinc-900">📕 Study</div>
              </div>
            </div>

            <div>
              <div className="mb-2 px-2 text-xs text-zinc-600">Chats</div>
              {filtered.length === 0 ? (
                <p className="px-2 py-8 text-xs text-zinc-600">{search ? "Nada encontrado" : "Nenhuma conversa"}</p>
              ) : (
                <>
                  {renderGroup("Today", today)}
                  {renderGroup("Yesterday", yesterday)}
                  {renderGroup("Older", older)}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {mode === "models" && (
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="mb-3 px-2 text-xs text-zinc-600">Available models</div>
          <div className="space-y-2">
            {models.length === 0 ? (
              <p className="px-2 py-8 text-xs text-zinc-600">Nenhum modelo carregado</p>
            ) : (
              models.map((model) => (
                <div key={model.id} className="rounded-2xl border border-zinc-900 bg-zinc-950 p-3">
                  <div className="text-sm text-zinc-100">{model.name || model.id}</div>
                  <div className="mt-1 truncate font-mono text-[11px] text-zinc-500">{model.id}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {model.provider && <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400">{model.provider}</span>}
                    {model.reasoning && <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-300">reasoning</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {mode === "devices" && (
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="mb-3 px-2 text-xs text-zinc-600">Workspace / devices</div>
          <div className="space-y-2">
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm text-zinc-200">
                <span className={`h-2 w-2 rounded-full ${statusColor}`} />
                Gateway {health?.status || connectionState}
              </div>
              <div className="space-y-1 text-[11px] text-zinc-500">
                <div className="flex justify-between gap-2"><span>Version</span><span className="text-zinc-300">{health ? `v${health.version}` : "-"}</span></div>
                <div className="flex justify-between gap-2"><span>Uptime</span><span className="text-zinc-300">{health ? formatUptime(health.uptimeMs) : "-"}</span></div>
              </div>
              <button
                onClick={onRefresh}
                className="mt-3 rounded-lg bg-zinc-900 px-3 py-2 text-xs text-zinc-300 transition hover:bg-zinc-800"
              >
                Refresh
              </button>
            </div>

            {devices.map((device) => (
              <div key={device.deviceId + device.clientId} className="rounded-2xl border border-zinc-900 bg-zinc-950 p-3">
                <div className="text-sm text-zinc-100">{device.clientId}</div>
                <div className="mt-1 text-[11px] text-zinc-500">{device.platform || "unknown platform"}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400">{device.deviceId}</span>
                  {device.role && <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400">{device.role}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-zinc-900 px-3 py-4">
        <div className="flex items-center gap-3 rounded-2xl px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-[11px] font-semibold text-black">TB</div>
          <div className="min-w-0">
            <div className="truncate text-sm text-zinc-200">Tim Baek</div>
            <div className="text-[11px] text-zinc-600">local session</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
