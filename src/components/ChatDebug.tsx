"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAppStore, ChatSession } from "@/lib/store";
import { ChatMessage } from "@/lib/openclaw-client";

// ============ Log capture system ============

interface LogEntry {
  ts: number;
  level: "log" | "warn" | "error" | "debug" | "info";
  args: string;
  source?: string;
}

const logBuffer: LogEntry[] = [];
const MAX_LOG_ENTRIES = 500;
let logListeners: (() => void)[] = [];

function notifyLogListeners() {
  for (const fn of logListeners) fn();
}

// Intercept console to capture OpenClaw logs
if (typeof window !== "undefined" && !(window as unknown as Record<string, boolean>).__chatDebugPatched) {
  (window as unknown as Record<string, boolean>).__chatDebugPatched = true;
  const origLog = console.log;
  const origWarn = console.warn;
  const origError = console.error;
  const origDebug = console.debug;
  const origInfo = console.info;

  function capture(level: LogEntry["level"], args: unknown[]) {
    const text = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");
    // Only capture OpenClaw-related or interesting logs
    if (text.includes("[OpenClaw]") || text.includes("WebSocket") || text.includes("RPC") || level === "error" || level === "warn") {
      logBuffer.push({ ts: Date.now(), level, args: text, source: text.includes("[OpenClaw]") ? "openclaw" : "app" });
      if (logBuffer.length > MAX_LOG_ENTRIES) logBuffer.shift();
      notifyLogListeners();
    }
  }

  console.log = (...args) => { capture("log", args); origLog.apply(console, args); };
  console.warn = (...args) => { capture("warn", args); origWarn.apply(console, args); };
  console.error = (...args) => { capture("error", args); origError.apply(console, args); };
  console.debug = (...args) => { capture("debug", args); origDebug.apply(console, args); };
  console.info = (...args) => { capture("info", args); origInfo.apply(console, args); };
}

// ============ Export format ============

interface ChatExport {
  version: 1;
  exportedAt: string;
  session: {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    messageCount: number;
  };
  messages: ChatMessage[];
  meta: {
    model: string | null;
    gateway: string;
    userAgent: string;
  };
}

function exportSession(session: ChatSession, model: string | null, gateway: string): ChatExport {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    session: {
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messageCount: session.messages.length,
    },
    messages: session.messages,
    meta: {
      model,
      gateway,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    },
  };
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadMarkdown(session: ChatSession): string {
  let md = `# ${session.title}\n\n`;
  md += `> Sessão: \`${session.id}\`\n`;
  md += `> Criada: ${new Date(session.createdAt).toLocaleString("pt-BR")}\n\n`;
  md += `---\n\n`;

  for (const msg of session.messages) {
    const role = msg.role === "user" ? "**Você**" : msg.role === "assistant" ? "**LomboClaw**" : `**${msg.role}**`;
    const time = new Date(msg.timestamp).toLocaleTimeString("pt-BR");

    md += `### ${role} — ${time}\n\n`;

    if (msg.thinking) {
      md += `<details><summary>Pensamento</summary>\n\n${msg.thinking}\n\n</details>\n\n`;
    }

    if (msg.toolCalls && msg.toolCalls.length > 0) {
      for (const tool of msg.toolCalls) {
        md += `> 🔧 **${tool.name}** \`${JSON.stringify(tool.input)}\`\n`;
        if (tool.output) md += `> → ${tool.output.slice(0, 200)}${tool.output.length > 200 ? "..." : ""}\n`;
      }
      md += "\n";
    }

    md += `${msg.content}\n\n`;

    if (msg.usage) {
      md += `*${msg.usage.inputTokens + msg.usage.outputTokens} tokens (in: ${msg.usage.inputTokens}, out: ${msg.usage.outputTokens})*\n\n`;
    }

    md += `---\n\n`;
  }

  return md;
}

// ============ Component ============

type DebugTab = "messages" | "logs" | "export" | "raw";

export function ChatDebug({ onClose }: { onClose: () => void }) {
  const { sessions, activeSessionId, selectedModel, auth, streaming, connectionState, addMessage, createSession, setActiveSession } = useAppStore();
  const [tab, setTab] = useState<DebugTab>("messages");
  const [logEntries, setLogEntries] = useState<LogEntry[]>([...logBuffer]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState("");
  const [importing, setImporting] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messages = activeSession?.messages ?? [];

  // Subscribe to log updates
  useEffect(() => {
    const handler = () => setLogEntries([...logBuffer]);
    logListeners.push(handler);
    return () => { logListeners = logListeners.filter((fn) => fn !== handler); };
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (autoScroll && tab === "logs") {
      logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logEntries, autoScroll, tab]);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Export handlers
  const handleExportJson = useCallback(() => {
    if (!activeSession) return;
    const data = exportSession(activeSession, selectedModel, auth.gatewayUrl);
    const safeName = activeSession.title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
    downloadJson(data, `lomboclaw-${safeName}-${Date.now()}.json`);
  }, [activeSession, selectedModel, auth.gatewayUrl]);

  const handleExportMarkdown = useCallback(() => {
    if (!activeSession) return;
    const md = downloadMarkdown(activeSession);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = activeSession.title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
    a.download = `lomboclaw-${safeName}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeSession]);

  const handleExportAllJson = useCallback(() => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      sessionCount: sessions.length,
      sessions: sessions.map((s) => exportSession(s, selectedModel, auth.gatewayUrl)),
    };
    downloadJson(data, `lomboclaw-all-sessions-${Date.now()}.json`);
  }, [sessions, selectedModel, auth.gatewayUrl]);

  const handleExportLogs = useCallback(() => {
    downloadJson({ exportedAt: new Date().toISOString(), entries: logEntries }, `lomboclaw-logs-${Date.now()}.json`);
  }, [logEntries]);

  // Import handler
  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.version === 1 && data.messages && Array.isArray(data.messages)) {
        // Single session import
        const sessionId = `imported-${Date.now()}`;
        createSession(sessionId);
        const title = data.session?.title || file.name.replace(/\.json$/, "");
        useAppStore.getState().renameSession(sessionId, `[Import] ${title}`);
        for (const msg of data.messages) {
          addMessage(sessionId, msg);
        }
        setActiveSession(sessionId);
      } else if (data.sessions && Array.isArray(data.sessions)) {
        // Multi-session import
        for (const exported of data.sessions) {
          const sessionId = `imported-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          createSession(sessionId);
          const title = exported.session?.title || "Importado";
          useAppStore.getState().renameSession(sessionId, `[Import] ${title}`);
          for (const msg of exported.messages || []) {
            addMessage(sessionId, msg);
          }
        }
      }
    } catch (err) {
      alert("Erro ao importar: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [createSession, addMessage, setActiveSession]);

  // Filter
  const filteredLogs = filter
    ? logEntries.filter((e) => e.args.toLowerCase().includes(filter.toLowerCase()))
    : logEntries;

  const filteredMessages = filter
    ? messages.filter((m) => m.content.toLowerCase().includes(filter.toLowerCase()) || m.role.includes(filter.toLowerCase()))
    : messages;

  const TABS: { key: DebugTab; label: string }[] = [
    { key: "messages", label: `Mensagens (${messages.length})` },
    { key: "logs", label: `Logs (${logEntries.length})` },
    { key: "export", label: "Exportar / Importar" },
    { key: "raw", label: "Raw State" },
  ];

  const levelColor: Record<string, string> = {
    log: "text-zinc-400",
    info: "text-blue-400",
    debug: "text-zinc-500",
    warn: "text-amber-400",
    error: "text-red-400",
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="flex h-[85vh] w-[90vw] max-w-[1100px] flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#111112] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
          <div className="flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <span className="text-lg font-semibold text-zinc-100">Debug & Logs</span>
            <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-500">
              {connectionState} | {activeSession?.id.slice(0, 12)}...
            </span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-zinc-800 px-4 py-1.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-3 py-1.5 text-[12px] transition ${
                tab === t.key ? "bg-zinc-800 text-zinc-100 font-medium" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
              }`}
            >
              {t.label}
            </button>
          ))}
          <div className="flex-1" />
          {(tab === "messages" || tab === "logs") && (
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrar..."
              className="w-[200px] rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-[11px] text-zinc-300 outline-none placeholder:text-zinc-600 focus:border-zinc-700"
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* ---- Messages Tab ---- */}
          {tab === "messages" && (
            <div className="p-4 space-y-2">
              {filteredMessages.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-600">Nenhuma mensagem nesta sessão</p>
              ) : filteredMessages.map((msg, i) => (
                <MessageDebugCard key={msg.id || i} message={msg} index={i} />
              ))}
              {streaming && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[11px] font-medium text-amber-400">STREAMING</span>
                    <span className="font-mono text-[10px] text-zinc-500">runId: {streaming.runId}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-[11px]">
                    <div>
                      <span className="text-zinc-500">Content:</span>
                      <span className="ml-1 text-zinc-300">{streaming.content.length} chars</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Thinking:</span>
                      <span className="ml-1 text-zinc-300">{streaming.thinking.length} chars</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Tools:</span>
                      <span className="ml-1 text-zinc-300">{streaming.toolCalls.length}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---- Logs Tab ---- */}
          {tab === "logs" && (
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 py-1">
                <label className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    className="rounded border-zinc-700"
                  />
                  Auto-scroll
                </label>
                <button
                  onClick={() => { logBuffer.length = 0; setLogEntries([]); }}
                  className="rounded px-2 py-0.5 text-[10px] text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
                >
                  Limpar
                </button>
                <span className="text-[10px] text-zinc-600">{filteredLogs.length} entradas</span>
              </div>
              <div className="font-mono text-[11px] leading-relaxed">
                {filteredLogs.map((entry, i) => (
                  <div key={i} className="flex gap-2 px-2 py-0.5 hover:bg-zinc-900/50 rounded">
                    <span className="shrink-0 text-zinc-600 w-[70px]">
                      {new Date(entry.ts).toLocaleTimeString("pt-BR", { hour12: false })}
                    </span>
                    <span className={`shrink-0 w-[40px] uppercase text-[10px] font-bold ${levelColor[entry.level]}`}>
                      {entry.level}
                    </span>
                    <span className={`min-w-0 break-all ${levelColor[entry.level]}`}>
                      {entry.args}
                    </span>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
              {filteredLogs.length === 0 && (
                <p className="py-8 text-center text-[12px] text-zinc-600">
                  Nenhum log capturado ainda. Logs do [OpenClaw] aparecem aqui automaticamente.
                </p>
              )}
            </div>
          )}

          {/* ---- Export/Import Tab ---- */}
          {tab === "export" && (
            <div className="p-5 space-y-5">
              {/* Export current session */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">Exportar sessão atual</h3>
                <p className="text-[11px] text-zinc-500 mb-3">
                  {activeSession ? `"${activeSession.title}" — ${messages.length} mensagens` : "Nenhuma sessão ativa"}
                </p>
                <div className="flex flex-wrap gap-2">
                  <ExportButton
                    onClick={handleExportJson}
                    disabled={!activeSession || messages.length === 0}
                    icon="{ }"
                    label="JSON"
                    desc="Dados completos, reimportável"
                  />
                  <ExportButton
                    onClick={handleExportMarkdown}
                    disabled={!activeSession || messages.length === 0}
                    icon="MD"
                    label="Markdown"
                    desc="Legível, com formatação"
                  />
                </div>
              </div>

              {/* Export all sessions */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">Exportar todas as sessões</h3>
                <p className="text-[11px] text-zinc-500 mb-3">{sessions.length} sessões salvas</p>
                <ExportButton
                  onClick={handleExportAllJson}
                  disabled={sessions.length === 0}
                  icon="[{ }]"
                  label="Todas (JSON)"
                  desc="Backup completo"
                />
              </div>

              {/* Export logs */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">Exportar logs</h3>
                <p className="text-[11px] text-zinc-500 mb-3">{logEntries.length} entradas de log</p>
                <ExportButton
                  onClick={handleExportLogs}
                  disabled={logEntries.length === 0}
                  icon="LOG"
                  label="Logs (JSON)"
                  desc="Logs de debug capturados"
                />
              </div>

              {/* Import */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">Importar sessão</h3>
                <p className="text-[11px] text-zinc-500 mb-3">
                  Importe um JSON exportado anteriormente. A sessão será adicionada à sidebar.
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={importing}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-[12px] font-medium text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                  </svg>
                  {importing ? "Importando..." : "Selecionar arquivo JSON"}
                </button>
              </div>
            </div>
          )}

          {/* ---- Raw State Tab ---- */}
          {tab === "raw" && (
            <div className="p-4 space-y-4">
              <RawStateBlock title="Sessão ativa" data={{
                id: activeSession?.id,
                title: activeSession?.title,
                messageCount: messages.length,
                createdAt: activeSession?.createdAt ? new Date(activeSession.createdAt).toISOString() : null,
                updatedAt: activeSession?.updatedAt ? new Date(activeSession.updatedAt).toISOString() : null,
              }} />
              <RawStateBlock title="Streaming" data={streaming ? {
                runId: streaming.runId,
                contentLength: streaming.content.length,
                thinkingLength: streaming.thinking.length,
                toolCalls: streaming.toolCalls.length,
                contentPreview: streaming.content.slice(-200),
              } : null} />
              <RawStateBlock title="Conexão" data={{
                state: connectionState,
                gateway: auth.gatewayUrl,
                model: selectedModel,
                sessionCount: sessions.length,
                totalMessages: sessions.reduce((sum, s) => sum + s.messages.length, 0),
              }} />
              <RawStateBlock title="Todas as sessões" data={sessions.map((s) => ({
                id: s.id,
                title: s.title,
                messages: s.messages.length,
                updated: new Date(s.updatedAt).toISOString(),
              }))} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ Sub-components ============

function MessageDebugCard({ message, index }: { message: ChatMessage; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const isUser = message.role === "user";

  return (
    <div className={`rounded-xl border p-3 ${
      isUser ? "border-blue-500/20 bg-blue-500/5" : message.state === "error" ? "border-red-500/20 bg-red-500/5" : "border-zinc-800 bg-zinc-900/30"
    }`}>
      <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center justify-between text-left">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-zinc-600">#{index}</span>
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
            isUser ? "bg-blue-500/15 text-blue-400" : "bg-emerald-500/15 text-emerald-400"
          }`}>
            {message.role}
          </span>
          <span className="text-[11px] text-zinc-400 truncate max-w-[500px]">
            {message.content.slice(0, 100)}{message.content.length > 100 ? "..." : ""}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {message.thinking && <span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-[9px] text-violet-300">thinking</span>}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] text-amber-400">{message.toolCalls.length} tools</span>
          )}
          {message.usage && (
            <span className="text-[10px] text-zinc-600">{message.usage.inputTokens + message.usage.outputTokens}t</span>
          )}
          {message.state && message.state !== "final" && (
            <span className={`rounded px-1.5 py-0.5 text-[9px] ${
              message.state === "error" ? "bg-red-500/15 text-red-400" : "bg-zinc-800 text-zinc-500"
            }`}>{message.state}</span>
          )}
          <span className="text-[10px] text-zinc-600">
            {new Date(message.timestamp).toLocaleTimeString("pt-BR", { hour12: false })}
          </span>
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`text-zinc-500 transition ${expanded ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 border-t border-zinc-800/50 pt-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
            <div><span className="text-zinc-500">ID:</span> <span className="font-mono text-zinc-400">{message.id}</span></div>
            <div><span className="text-zinc-500">State:</span> <span className="text-zinc-400">{message.state || "final"}</span></div>
            <div><span className="text-zinc-500">Timestamp:</span> <span className="text-zinc-400">{new Date(message.timestamp).toISOString()}</span></div>
            {message.usage && (
              <div><span className="text-zinc-500">Tokens:</span> <span className="text-zinc-400">in={message.usage.inputTokens} out={message.usage.outputTokens}</span></div>
            )}
          </div>

          {message.thinking && (
            <div>
              <div className="text-[10px] font-medium text-violet-400 mb-1">Thinking ({message.thinking.length} chars)</div>
              <pre className="max-h-[150px] overflow-auto rounded-lg bg-zinc-950 p-2 font-mono text-[10px] text-zinc-500 leading-relaxed">
                {message.thinking}
              </pre>
            </div>
          )}

          {message.toolCalls && message.toolCalls.length > 0 && (
            <div>
              <div className="text-[10px] font-medium text-amber-400 mb-1">Tool Calls</div>
              {message.toolCalls.map((tool) => (
                <div key={tool.id} className="mb-1 rounded-lg bg-zinc-950 p-2">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-medium text-amber-300">{tool.name}</span>
                    <span className={`rounded px-1 py-0.5 text-[9px] ${
                      tool.state === "done" ? "bg-emerald-500/15 text-emerald-400" :
                      tool.state === "error" ? "bg-red-500/15 text-red-400" :
                      "bg-zinc-800 text-zinc-500"
                    }`}>{tool.state || "?"}</span>
                  </div>
                  <pre className="mt-1 font-mono text-[10px] text-zinc-500 overflow-x-auto">{JSON.stringify(tool.input, null, 2)}</pre>
                  {tool.output && (
                    <pre className="mt-1 font-mono text-[10px] text-zinc-600 overflow-x-auto max-h-[80px] overflow-y-auto">
                      {tool.output.slice(0, 500)}{tool.output.length > 500 ? "..." : ""}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}

          <div>
            <div className="text-[10px] font-medium text-zinc-400 mb-1">Content ({message.content.length} chars)</div>
            <pre className="max-h-[200px] overflow-auto rounded-lg bg-zinc-950 p-2 font-mono text-[10px] text-zinc-400 leading-relaxed whitespace-pre-wrap">
              {message.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function ExportButton({ onClick, disabled, icon, label, desc }: {
  onClick: () => void; disabled: boolean; icon: string; label: string; desc: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-left transition hover:border-zinc-700 hover:bg-zinc-800/50 disabled:opacity-30"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-800 font-mono text-[10px] font-bold text-zinc-400">{icon}</span>
      <div>
        <div className="text-[12px] font-medium text-zinc-200">{label}</div>
        <div className="text-[10px] text-zinc-500">{desc}</div>
      </div>
    </button>
  );
}

function RawStateBlock({ title, data }: { title: string; data: unknown }) {
  const [expanded, setExpanded] = useState(false);
  const text = JSON.stringify(data, null, 2);
  const lines = text.split("\n").length;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30">
      <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center justify-between px-4 py-2.5 text-left">
        <span className="text-[13px] font-medium text-zinc-200">{title}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-600">{lines} linhas</span>
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`text-zinc-500 transition ${expanded ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>
      {expanded && (
        <div className="border-t border-zinc-800 px-4 py-3">
          <pre className="max-h-[300px] overflow-auto rounded-lg bg-zinc-950 p-3 font-mono text-[11px] leading-relaxed text-zinc-400">
            {text}
          </pre>
        </div>
      )}
    </div>
  );
}
