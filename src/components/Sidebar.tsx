"use client";

import { useState } from "react";
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

type BottomPanel = "none" | "devices" | "info";

export function Sidebar({ onNewChat, devices, health, onRefresh }: SidebarProps) {
  const { sessions, activeSessionId, setActiveSession, deleteSession, toggleSidebar, connectionState } = useAppStore();
  const [search, setSearch] = useState("");
  const [bottomPanel, setBottomPanel] = useState<BottomPanel>("none");

  const statusColor = {
    connected: "bg-emerald-500",
    connecting: "bg-amber-500 animate-pulse",
    disconnected: "bg-zinc-600",
    error: "bg-red-500",
  }[connectionState];

  // Filter sessions by search
  const filtered = search
    ? sessions.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()))
    : sessions;

  // Group by time
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
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
        session.id === activeSessionId
          ? "bg-zinc-800 text-zinc-100"
          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
      }`}
      onClick={() => setActiveSession(session.id)}
    >
      <span className="truncate flex-1">{session.title}</span>
      <span className="text-[10px] text-zinc-600 shrink-0 group-hover:hidden">
        {timeAgo(session.updatedAt)}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          deleteSession(session.id);
        }}
        className="hidden group-hover:block p-0.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-all shrink-0"
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
      <div className="mb-2">
        <div className="text-[11px] text-zinc-600 font-medium px-3 py-1">
          {label}
        </div>
        {items.map(renderSession)}
      </div>
    );
  };

  return (
    <aside className="w-[260px] h-full bg-zinc-900 flex flex-col border-r border-zinc-800/50">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-3 shrink-0">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          title="Fechar sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 3v18" />
          </svg>
        </button>
        <button
          onClick={onNewChat}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          title="Nova conversa"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversas..."
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-800/50 rounded-lg text-xs text-zinc-300 placeholder-zinc-600 outline-none focus:bg-zinc-800 transition-colors"
          />
        </div>
      </div>

      {/* Sessions */}
      <div className="flex-1 overflow-y-auto px-2">
        {filtered.length === 0 ? (
          <p className="text-xs text-zinc-600 text-center py-8">
            {search ? "Nenhum resultado" : "Nenhuma conversa"}
          </p>
        ) : (
          <>
            {renderGroup("Hoje", today)}
            {renderGroup("Ontem", yesterday)}
            {renderGroup("Anteriores", older)}
          </>
        )}
      </div>

      {/* Bottom panels */}
      <div className="border-t border-zinc-800/50 shrink-0">
        {/* Toggle buttons */}
        <div className="flex items-center gap-0.5 px-2 py-1.5">
          <button
            onClick={() => setBottomPanel(bottomPanel === "devices" ? "none" : "devices")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] transition-colors ${
              bottomPanel === "devices"
                ? "bg-zinc-800 text-emerald-400"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
            Devices
            {devices.length > 0 && <span className="text-zinc-600">{devices.length}</span>}
          </button>
          <button
            onClick={() => setBottomPanel(bottomPanel === "info" ? "none" : "info")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] transition-colors ${
              bottomPanel === "info"
                ? "bg-zinc-800 text-emerald-400"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            Info
          </button>
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
            title="Atualizar"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
          </button>
        </div>

        {/* Devices Panel */}
        {bottomPanel === "devices" && (
          <div className="px-2 pb-2 max-h-44 overflow-y-auto">
            {devices.length === 0 ? (
              <p className="text-[11px] text-zinc-600 px-2 py-2">Nenhum device</p>
            ) : (
              <div className="space-y-0.5">
                {devices.map((device) => (
                  <div
                    key={device.deviceId}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-zinc-400 hover:bg-zinc-800/50"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-mono">{device.clientId}</span>
                    <span className="text-zinc-600 text-[10px]">{device.platform}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info Panel */}
        {bottomPanel === "info" && health && (
          <div className="px-3 pb-2 space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-600">Status</span>
              <span className="text-zinc-400">{health.status}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-600">Uptime</span>
              <span className="text-zinc-400">{formatUptime(health.uptimeMs)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-600">Versão</span>
              <span className="text-zinc-400">v{health.version}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-zinc-800/50 shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full shrink-0 ${statusColor}`} />
          <span className="text-[11px] text-zinc-600 flex-1">LomboClaw</span>
          <span className="text-[10px] text-zinc-700">
            {health ? `v${health.version}` : ""}
          </span>
        </div>
      </div>
    </aside>
  );
}
