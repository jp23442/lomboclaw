"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { GatewayModel, GatewayDevice } from "@/hooks/useGatewayInfo";
import { LogoBox } from "./Logo";

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
  const { sessions, activeSessionId, setActiveSession, deleteSession, toggleSidebar, connectionState, logout, auth } = useAppStore();
  const [search, setBuscar] = useState("");
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
    { key: "main" as SidebarMode, label: "Nova Conversa", icon: <path d="M12 5v14M5 12h14" />, action: onNewChat },
    { key: "main" as SidebarMode, label: "Buscar", icon: <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></>, action: () => setMode("main") },
    { key: "models" as SidebarMode, label: "Modelos", icon: <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />, action: () => setMode("models") },
    { key: "devices" as SidebarMode, label: "Dispositivos", icon: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>, action: () => setMode("devices") },
  ];

  const renderSession = (session: typeof sessions[0]) => (
    <div
      key={session.id}
      className={`group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition ${
        session.id === activeSessionId
          ? "bg-zinc-800 text-zinc-100"
          : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
      }`}
      onClick={() => setActiveSession(session.id)}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate">{session.title}</div>
      </div>
      <span className="shrink-0 text-[9px] text-zinc-600 group-hover:hidden">{timeAgo(session.updatedAt)}</span>
      <button
        onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
        className="hidden rounded p-0.5 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-200 group-hover:block"
        title="Apagar"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  const renderGroup = (label: string, items: typeof sessions) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-3">
        <div className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wider text-zinc-600">{label}</div>
        <div className="space-y-0.5">{items.map(renderSession)}</div>
      </div>
    );
  };

  return (
    <aside className="flex h-full w-[240px] flex-col border-r border-zinc-800/60 bg-[#0d0d0d] text-zinc-100">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <LogoBox size={28} className="rounded-md" />
          <div className="text-[13px] font-semibold text-zinc-100">LomboClaw</div>
        </div>
        <button
          onClick={toggleSidebar}
          className="rounded-md p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
          title="Fechar sidebar"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="4" width="16" height="16" rx="3" />
            <path d="M10 4v16" />
          </svg>
        </button>
      </div>

      <div className="px-2.5 pb-3">
        <div className="space-y-0.5">
          {navItems.map((item, index) => (
            <button
              key={`${item.label}-${index}`}
              onClick={item.action}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] text-zinc-400 transition hover:bg-zinc-800/60 hover:text-zinc-200"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-zinc-500">
                {item.icon}
              </svg>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "main" && (
        <>
          <div className="px-2.5 pb-2.5">
            <input
              type="text"
              value={search}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="Buscar conversas"
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-[11px] text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-zinc-700"
            />
          </div>

          <div className="flex-1 overflow-y-auto px-2.5">
            {filtered.length === 0 ? (
              <p className="px-2 py-6 text-[11px] text-zinc-600">{search ? "Nada encontrado" : "Nenhuma conversa"}</p>
            ) : (
              <>
                {renderGroup("Hoje", today)}
                {renderGroup("Ontem", yesterday)}
                {renderGroup("Antigas", older)}
              </>
            )}
          </div>
        </>
      )}

      {mode === "models" && (
        <div className="flex-1 overflow-y-auto px-2.5 pb-3">
          <div className="mb-2 px-2 text-[10px] font-medium uppercase tracking-wider text-zinc-600">Modelos</div>
          <div className="space-y-1">
            {models.length === 0 ? (
              <p className="px-2 py-6 text-[11px] text-zinc-600">Nenhum modelo carregado</p>
            ) : (
              models.map((model) => (
                <div key={model.id} className="rounded-md border border-zinc-800 bg-zinc-900/50 p-2">
                  <div className="text-[12px] text-zinc-100">{model.name || model.id}</div>
                  <div className="mt-0.5 truncate font-mono text-[10px] text-zinc-500">{model.id}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {model.provider && <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-400">{model.provider}</span>}
                    {model.reasoning && <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[9px] text-violet-300">reasoning</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {mode === "devices" && (
        <div className="flex-1 overflow-y-auto px-2.5 pb-3">
          <div className="mb-2 px-2 text-[10px] font-medium uppercase tracking-wider text-zinc-600">Gateway</div>
          <div className="space-y-1">
            <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-2">
              <div className="flex items-center gap-1.5 text-[12px] text-zinc-200">
                <span className={`h-1.5 w-1.5 rounded-full ${statusColor}`} />
                {health?.status || connectionState}
              </div>
              <div className="mt-1 space-y-0.5 text-[10px] text-zinc-500">
                <div className="flex justify-between"><span>Version</span><span className="text-zinc-400">{health ? `v${health.version}` : "-"}</span></div>
                <div className="flex justify-between"><span>Uptime</span><span className="text-zinc-400">{health ? formatUptime(health.uptimeMs) : "-"}</span></div>
              </div>
              <button onClick={onRefresh} className="mt-1.5 rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-700">
                Refresh
              </button>
            </div>

            {devices.map((device) => (
              <div key={device.deviceId + device.clientId} className="rounded-md border border-zinc-800 bg-zinc-900/50 p-2">
                <div className="text-[12px] text-zinc-100">{device.clientId}</div>
                <div className="mt-0.5 text-[10px] text-zinc-500">{device.platform || "unknown"}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-400">{device.deviceId}</span>
                  {device.role && <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-400">{device.role}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-zinc-800/60 px-2.5 py-2">
        <div className="flex items-center justify-between rounded-md px-2 py-1">
          <div className="min-w-0 flex-1">
            <div className="truncate font-mono text-[10px] text-zinc-500" title={auth.gatewayUrl}>
              {auth.gatewayUrl.replace(/^wss?:\/\//, "")}
            </div>
          </div>
          <button
            onClick={logout}
            className="shrink-0 rounded-md p-1 text-zinc-600 transition hover:bg-zinc-800 hover:text-red-400"
            title="Desconectar"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
