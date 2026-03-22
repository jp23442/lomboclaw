"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { OpenClawClient } from "@/lib/openclaw-client";

interface SettingsProps {
  clientRef: React.RefObject<OpenClawClient | null>;
  onClose: () => void;
}

type Tab =
  | "config"
  | "models"
  | "tools"
  | "agents"
  | "skills"
  | "devices"
  | "sessions"
  | "cron"
  | "tts"
  | "approvals"
  | "system";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: "config",
    label: "Configuração",
    icon: (
      <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
    ),
  },
  {
    key: "models",
    label: "Modelos",
    icon: <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />,
  },
  {
    key: "tools",
    label: "Ferramentas",
    icon: (
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    ),
  },
  {
    key: "agents",
    label: "Agentes",
    icon: (
      <>
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </>
    ),
  },
  {
    key: "skills",
    label: "Skills",
    icon: <path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" />,
  },
  {
    key: "devices",
    label: "Dispositivos",
    icon: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
  },
  {
    key: "sessions",
    label: "Sessões",
    icon: (
      <>
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </>
    ),
  },
  {
    key: "cron",
    label: "Cron",
    icon: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  },
  {
    key: "tts",
    label: "TTS",
    icon: (
      <>
        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
        <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
      </>
    ),
  },
  {
    key: "approvals",
    label: "Aprovações",
    icon: (
      <>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </>
    ),
  },
  {
    key: "system",
    label: "Sistema",
    icon: (
      <>
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <path d="M8 21h8M12 17v4" />
      </>
    ),
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = Record<string, any>;

export function Settings({ clientRef, onClose }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("config");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="flex h-[85vh] w-[90vw] max-w-[1200px] overflow-hidden rounded-2xl border border-zinc-800 bg-[#111112] shadow-2xl">
        {/* Sidebar tabs */}
        <nav className="flex w-[220px] shrink-0 flex-col border-r border-zinc-800 bg-[#0b0b0c] pt-5">
          <div className="mb-5 px-5 text-lg font-semibold text-zinc-100">Configurações</div>
          <div className="flex-1 space-y-0.5 overflow-y-auto px-3">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  activeTab === tab.key
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0">
                  {tab.icon}
                </svg>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="border-t border-zinc-800 p-4">
            <button
              onClick={onClose}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              Fechar
            </button>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "config" && <ConfigSection clientRef={clientRef} />}
          {activeTab === "models" && <ModelsSection clientRef={clientRef} />}
          {activeTab === "tools" && <ToolsSection clientRef={clientRef} />}
          {activeTab === "agents" && <AgentsSection clientRef={clientRef} />}
          {activeTab === "skills" && <SkillsSection clientRef={clientRef} />}
          {activeTab === "devices" && <DevicesSection clientRef={clientRef} />}
          {activeTab === "sessions" && <SessionsSection clientRef={clientRef} />}
          {activeTab === "cron" && <CronSection clientRef={clientRef} />}
          {activeTab === "tts" && <TTSSection clientRef={clientRef} />}
          {activeTab === "approvals" && <ApprovalsSection clientRef={clientRef} />}
          {activeTab === "system" && <SystemSection clientRef={clientRef} />}
        </div>
      </div>
    </div>
  );
}

// ============ Shared helpers ============

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-zinc-100">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center gap-2 py-8 text-sm text-zinc-500">
      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
        <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      Carregando...
    </div>
  );
}

function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
      <p className="text-sm text-red-400">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700">
          Tentar novamente
        </button>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-zinc-600">{text}</p>;
}

function DataCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 ${className}`}>
      {children}
    </div>
  );
}

function Badge({ children, color = "zinc" }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    zinc: "bg-zinc-800 text-zinc-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
    violet: "bg-violet-500/10 text-violet-300",
    amber: "bg-amber-500/10 text-amber-400",
    red: "bg-red-500/10 text-red-400",
    blue: "bg-blue-500/10 text-blue-400",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${colors[color] || colors.zinc}`}>
      {children}
    </span>
  );
}

function ActionButton({ onClick, children, variant = "default", disabled = false }: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "default" | "danger" | "success";
  disabled?: boolean;
}) {
  const styles = {
    default: "bg-zinc-800 text-zinc-300 hover:bg-zinc-700",
    danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20",
    success: "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3 py-1.5 text-xs transition disabled:opacity-30 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

function JsonViewer({ data, maxHeight = "300px" }: { data: unknown; maxHeight?: string }) {
  const [expanded, setExpanded] = useState(false);
  const text = JSON.stringify(data, null, 2);
  const lines = text.split("\n").length;
  const shouldTruncate = lines > 15 && !expanded;

  return (
    <div className="relative">
      <pre
        className="overflow-auto rounded-xl bg-zinc-950 p-3 font-mono text-[11px] leading-relaxed text-zinc-400"
        style={{ maxHeight: expanded ? "none" : maxHeight }}
      >
        {shouldTruncate ? text.split("\n").slice(0, 15).join("\n") + "\n..." : text}
      </pre>
      {lines > 15 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-[11px] text-zinc-500 hover:text-zinc-300"
        >
          {expanded ? "Recolher" : `Expandir (${lines} linhas)`}
        </button>
      )}
    </div>
  );
}

// Hook for fetching data from client methods
function useRpc<T>(
  clientRef: React.RefObject<OpenClawClient | null>,
  method: string,
  params: Record<string, unknown> = {}
): { data: T | null; loading: boolean; error: string | null; refresh: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    const client = clientRef.current;
    if (!client || !client.isConnected()) {
      setError("Não conectado ao gateway");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await client.rpc<T>(method, params);
      setData(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientRef, method]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refresh: fetch };
}

// ============ Section descriptions from schema ============

const SECTION_META: Record<string, { label: string; description: string }> = {
  env: { label: "Ambiente", description: "Variáveis de ambiente e paths do sistema" },
  wizard: { label: "Wizard", description: "Assistente de configuração inicial" },
  diagnostics: { label: "Diagnósticos", description: "Telemetria, crash reports e métricas" },
  logging: { label: "Logging", description: "Nível de log, rotação e destino" },
  cli: { label: "CLI", description: "Configurações da interface de linha de comando" },
  update: { label: "Atualizações", description: "Auto-update, canal e frequência" },
  browser: { label: "Navegador", description: "Configuração do browser embutido" },
  ui: { label: "Interface", description: "Tema, layout e preferências visuais" },
  secrets: { label: "Segredos", description: "API keys e credenciais (valores ocultos)" },
  auth: { label: "Autenticação", description: "Login, tokens e permissões" },
  acp: { label: "ACP", description: "Agent Control Protocol" },
  models: { label: "Modelos", description: "Modelos de IA, providers e routing" },
  nodehost: { label: "Node Host", description: "Configuração do host Node.js" },
  agents: { label: "Agentes", description: "Definições e comportamento dos agentes" },
  tools: { label: "Ferramentas", description: "Ferramentas disponíveis e catálogo" },
  bindings: { label: "Bindings", description: "Atalhos de teclado e mapeamentos" },
  broadcast: { label: "Broadcast", description: "Notificações e mensagens broadcast" },
  audio: { label: "Áudio", description: "Entrada/saída de áudio e dispositivos" },
  media: { label: "Mídia", description: "Processamento de imagens, vídeo e arquivos" },
  messages: { label: "Mensagens", description: "Formato, limites e histórico de mensagens" },
  commands: { label: "Comandos", description: "Comandos slash e ações disponíveis" },
  approvals: { label: "Aprovações", description: "Políticas de aprovação de comandos" },
  session: { label: "Sessão", description: "Gerenciamento de sessões e persistência" },
  cron: { label: "Cron", description: "Tarefas agendadas e timers" },
  hooks: { label: "Hooks", description: "Hooks de eventos e callbacks" },
  web: { label: "Web", description: "Servidor web embutido e API HTTP" },
  channels: { label: "Canais", description: "Canais de comunicação (Discord, Slack, etc)" },
  discovery: { label: "Discovery", description: "Descoberta de rede e mDNS" },
  canvashost: { label: "Canvas Host", description: "Host de canvas e renderização" },
  talk: { label: "Talk", description: "Conversação por voz e wake words" },
  gateway: { label: "Gateway", description: "Configuração do gateway HTTP/WebSocket" },
  memory: { label: "Memória", description: "Sistema de memória e recall do agente" },
  mcp: { label: "MCP", description: "Model Context Protocol servers" },
  skills: { label: "Skills", description: "Skills instaláveis e marketplace" },
  plugins: { label: "Plugins", description: "Sistema de plugins e extensões" },
  meta: { label: "Meta", description: "Metadados da configuração" },
};

// ============ Dynamic Form Field ============

function FieldLabel({ label, help, path }: { label: string; help?: string; path?: string }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="text-[13px] text-zinc-200">{label}</div>
        {path && <span className="font-mono text-[9px] text-zinc-600">{path}</span>}
      </div>
      {help && <div className="mt-0.5 text-[11px] text-zinc-500 leading-snug">{help}</div>}
    </div>
  );
}

function ConfigField({ path, value, schema, onChange, depth = 0 }: {
  path: string;
  value: unknown;
  schema: AnyData;
  onChange: (path: string, value: unknown) => void;
  depth?: number;
}) {
  const label = schema?.label || schema?.title || path.split(".").pop() || path;
  const help = schema?.help || schema?.description || "";
  const type = schema?.type || typeof value;
  const isSecret = /secret|password|key|token|apikey/i.test(path) || schema?.format === "password";

  // Enum / select dropdown
  if (schema?.enum && Array.isArray(schema.enum)) {
    return (
      <div className="rounded-xl bg-zinc-900/50 px-3 py-2.5">
        <FieldLabel label={label} help={help} />
        <select
          value={String(value ?? "")}
          onChange={(e) => {
            const v = e.target.value;
            // Try to preserve type
            if (schema.type === "number" || schema.type === "integer") onChange(path, Number(v));
            else if (v === "true") onChange(path, true);
            else if (v === "false") onChange(path, false);
            else onChange(path, v);
          }}
          className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-[13px] text-zinc-200 outline-none focus:border-zinc-700"
        >
          {schema.enum.map((opt: unknown) => (
            <option key={String(opt)} value={String(opt)}>{String(opt)}</option>
          ))}
        </select>
      </div>
    );
  }

  // Boolean toggle
  if (type === "boolean" || typeof value === "boolean") {
    return (
      <label className="flex items-center justify-between gap-3 rounded-xl bg-zinc-900/50 px-3 py-2.5 cursor-pointer">
        <FieldLabel label={label} help={help} />
        <button
          onClick={() => onChange(path, !value)}
          className={`relative h-5 w-9 shrink-0 rounded-full transition ${value ? "bg-emerald-500" : "bg-zinc-700"}`}
        >
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${value ? "left-[18px]" : "left-0.5"}`} />
        </button>
      </label>
    );
  }

  // Number with min/max/step
  if (type === "number" || type === "integer" || typeof value === "number") {
    return (
      <div className="rounded-xl bg-zinc-900/50 px-3 py-2.5">
        <FieldLabel label={label} help={help} />
        <div className="mt-1.5 flex items-center gap-2">
          <input
            type="number"
            value={value as number ?? 0}
            min={schema?.minimum}
            max={schema?.maximum}
            step={schema?.step || (type === "integer" ? 1 : undefined)}
            onChange={(e) => onChange(path, Number(e.target.value))}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-[13px] text-zinc-200 outline-none focus:border-zinc-700"
          />
          {(schema?.minimum !== undefined || schema?.maximum !== undefined) && (
            <span className="shrink-0 text-[10px] text-zinc-600">
              {schema.minimum !== undefined && `min: ${schema.minimum}`}
              {schema.minimum !== undefined && schema.maximum !== undefined && " · "}
              {schema.maximum !== undefined && `max: ${schema.maximum}`}
            </span>
          )}
        </div>
        {schema?.default !== undefined && (
          <div className="mt-1 text-[10px] text-zinc-600">Padrão: {String(schema.default)}</div>
        )}
      </div>
    );
  }

  // String field (with secret masking, textarea for long values, etc.)
  if (type === "string" || typeof value === "string") {
    const strVal = (value as string) ?? "";
    const isLong = strVal.length > 80 || schema?.format === "textarea";
    const isUrl = schema?.format === "uri" || schema?.format === "url";

    return (
      <div className="rounded-xl bg-zinc-900/50 px-3 py-2.5">
        <FieldLabel label={label} help={help} />
        {isLong ? (
          <textarea
            value={strVal}
            onChange={(e) => onChange(path, e.target.value)}
            rows={3}
            className="mt-1.5 w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-[13px] text-zinc-200 outline-none focus:border-zinc-700"
            placeholder={schema?.placeholder || schema?.default || ""}
          />
        ) : (
          <input
            type={isSecret ? "password" : isUrl ? "url" : "text"}
            value={strVal}
            onChange={(e) => onChange(path, e.target.value)}
            placeholder={schema?.placeholder || schema?.default || ""}
            className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-[13px] text-zinc-200 outline-none focus:border-zinc-700"
          />
        )}
        {schema?.default !== undefined && !isSecret && (
          <div className="mt-1 text-[10px] text-zinc-600">Padrão: {String(schema.default)}</div>
        )}
      </div>
    );
  }

  // Array editor (add/remove items)
  if (Array.isArray(value)) {
    const items = value as unknown[];
    const itemSchema = schema?.items || {};
    const isStringArray = items.every((v) => typeof v === "string" || typeof v === "number");

    return (
      <div className="rounded-xl bg-zinc-900/50 px-3 py-2.5">
        <FieldLabel label={label} help={help} />
        {isStringArray ? (
          <div className="mt-1.5">
            <div className="flex flex-wrap gap-1.5">
              {items.map((item, i) => (
                <span key={i} className="group inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-0.5 text-[11px] text-zinc-300">
                  {String(item)}
                  <button
                    onClick={() => {
                      const next = [...items];
                      next.splice(i, 1);
                      onChange(path, next);
                    }}
                    className="hidden rounded-full text-zinc-500 hover:text-red-400 group-hover:inline"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <ArrayItemAdder
              onAdd={(v) => onChange(path, [...items, v])}
              placeholder={itemSchema?.type === "number" ? "Adicionar número..." : "Adicionar item..."}
              parseAs={itemSchema?.type === "number" || itemSchema?.type === "integer" ? "number" : "string"}
            />
          </div>
        ) : (
          <div className="mt-1.5 space-y-1.5">
            {items.map((item, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <div className="flex-1 rounded-lg border border-zinc-800/50 bg-zinc-950 p-2">
                  {typeof item === "object" && item !== null ? (
                    <div className="space-y-1.5">
                      {Object.entries(item as AnyData).map(([k, v]) => (
                        <ConfigField
                          key={k}
                          path={`${path}[${i}].${k}`}
                          value={v}
                          schema={itemSchema?.properties?.[k] || {}}
                          onChange={onChange}
                          depth={depth + 1}
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-zinc-400">{JSON.stringify(item)}</span>
                  )}
                </div>
                <button
                  onClick={() => {
                    const next = [...items];
                    next.splice(i, 1);
                    onChange(path, next);
                  }}
                  className="mt-1 shrink-0 rounded p-0.5 text-zinc-600 hover:text-red-400"
                  title="Remover"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Nested object: render sub-fields recursively (up to depth 3)
  if (typeof value === "object" && value !== null) {
    if (depth >= 3) {
      return (
        <div className="rounded-xl bg-zinc-900/50 px-3 py-2.5">
          <FieldLabel label={label} help={help} />
          <JsonViewer data={value} maxHeight="150px" />
        </div>
      );
    }

    return (
      <NestedObjectField
        path={path}
        label={label}
        help={help}
        value={value as AnyData}
        schema={schema}
        onChange={onChange}
        depth={depth}
      />
    );
  }

  // Null / undefined — show as disabled text
  if (value === null || value === undefined) {
    return (
      <div className="rounded-xl bg-zinc-900/50 px-3 py-2.5">
        <FieldLabel label={label} help={help} />
        <div className="mt-1 text-[11px] italic text-zinc-600">{value === null ? "null" : "não definido"}</div>
      </div>
    );
  }

  return null;
}

// Inline add item for string/number arrays
function ArrayItemAdder({ onAdd, placeholder, parseAs }: {
  onAdd: (value: unknown) => void;
  placeholder: string;
  parseAs: "string" | "number";
}) {
  const [val, setVal] = useState("");

  const submit = () => {
    if (!val.trim()) return;
    onAdd(parseAs === "number" ? Number(val) : val.trim());
    setVal("");
  };

  return (
    <div className="mt-1.5 flex gap-1.5">
      <input
        type={parseAs === "number" ? "number" : "text"}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        placeholder={placeholder}
        className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-[11px] text-zinc-300 outline-none focus:border-zinc-700"
      />
      <button onClick={submit} className="rounded-lg bg-zinc-800 px-2 py-1 text-[10px] text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200">
        +
      </button>
    </div>
  );
}

// Nested object field with collapsible sub-fields
function NestedObjectField({ path, label, help, value, schema, onChange, depth }: {
  path: string;
  label: string;
  help: string;
  value: AnyData;
  schema: AnyData;
  onChange: (path: string, value: unknown) => void;
  depth: number;
}) {
  const [open, setOpen] = useState(depth < 1);
  const entries = Object.entries(value);

  return (
    <div className={`rounded-xl ${depth === 0 ? "border border-zinc-800/50 bg-zinc-900/30" : "bg-zinc-900/50"} overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <div>
          <div className="text-[13px] font-medium text-zinc-300">{label}</div>
          {help && !open && <div className="text-[10px] text-zinc-600 truncate max-w-[400px]">{help}</div>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-600">{entries.length} campos</span>
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`text-zinc-500 transition ${open ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-zinc-800/50 px-2 pb-2 pt-1.5 space-y-1.5">
          {entries.map(([key, val]) => {
            const subSchema = schema?.properties?.[key] || {};
            return (
              <ConfigField
                key={key}
                path={`${path}.${key}`}
                value={val}
                schema={subSchema}
                onChange={onChange}
                depth={depth + 1}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============ Config Section ============

function ConfigSection({ clientRef }: { clientRef: React.RefObject<OpenClawClient | null> }) {
  const { data, loading, error, refresh } = useRpc<AnyData>(clientRef, "config.get");
  const { data: schemaData } = useRpc<AnyData>(clientRef, "config.schema");
  const [mode, setMode] = useState<"visual" | "json">("visual");
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [localConfig, setLocalConfig] = useState<AnyData | null>(null);
  const [dirty, setDirty] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [searchFilter, setSearchFilter] = useState("");

  const config = data?.config as AnyData;
  const hash = data?.hash as string;
  const schema = schemaData?.schema as AnyData || schemaData as AnyData;

  // Sync local config when fetched
  useEffect(() => {
    if (config && !localConfig) setLocalConfig(structuredClone(config));
  }, [config, localConfig]);

  // Parse path supporting array notation like "foo.bar[0].baz"
  const handleFieldChange = (path: string, value: unknown) => {
    if (!localConfig) return;
    const updated = structuredClone(localConfig);
    // Split on dots and brackets: "a.b[0].c" -> ["a", "b", "0", "c"]
    const keys = path.replace(/\[(\d+)\]/g, ".$1").split(".");
    let obj: AnyData = updated;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (obj[k] === undefined || typeof obj[k] !== "object") {
        obj[k] = /^\d+$/.test(keys[i + 1]) ? [] : {};
      }
      obj = obj[k] as AnyData;
    }
    obj[keys[keys.length - 1]] = value;
    setLocalConfig(updated);
    setDirty(true);
  };

  const saveConfig = async (raw: string | AnyData) => {
    const client = clientRef.current;
    if (!client) return;
    setSaving(true);
    setSaveError(null);
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      await client.patchConfig(parsed, hash);
      setDirty(false);
      setLocalConfig(null);
      refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBox message={error} onRetry={refresh} />;

  const cfgToRender = localConfig || config;
  const allGroups = cfgToRender ? Object.keys(cfgToRender) : [];

  // Filter groups by search
  const groups = searchFilter
    ? allGroups.filter((k) => {
        const meta = SECTION_META[k];
        const label = meta?.label || k;
        const desc = meta?.description || "";
        const term = searchFilter.toLowerCase();
        return k.toLowerCase().includes(term) || label.toLowerCase().includes(term) || desc.toLowerCase().includes(term);
      })
    : allGroups;

  return (
    <div>
      <SectionHeader title="Configuração" subtitle="Configuração completa do gateway OpenClaw" />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge color="zinc">hash: {hash?.slice(0, 12)}...</Badge>
        <Badge color="zinc">{allGroups.length} seções</Badge>
        <div className="flex rounded-lg border border-zinc-800">
          <button
            onClick={() => setMode("visual")}
            className={`px-2.5 py-1 text-[11px] transition ${mode === "visual" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Visual
          </button>
          <button
            onClick={() => { setMode("json"); setEditValue(JSON.stringify(cfgToRender, null, 2)); }}
            className={`px-2.5 py-1 text-[11px] transition ${mode === "json" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            JSON
          </button>
        </div>
        <ActionButton onClick={() => { setLocalConfig(null); setDirty(false); refresh(); }}>Recarregar</ActionButton>
        {dirty && (
          <ActionButton onClick={() => saveConfig(localConfig!)} variant="success" disabled={saving}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </ActionButton>
        )}
      </div>

      {mode === "visual" && (
        <div className="mb-3">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filtrar seções..."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-[12px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-zinc-700"
          />
        </div>
      )}

      {saveError && <p className="mb-3 text-[12px] text-red-400">{saveError}</p>}

      {mode === "json" ? (
        <div>
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-[50vh] w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-[11px] leading-relaxed text-zinc-200 outline-none focus:border-zinc-700"
            spellCheck={false}
          />
          <div className="mt-3 flex gap-2">
            <ActionButton onClick={() => saveConfig(editValue)} variant="success" disabled={saving}>
              {saving ? "Salvando..." : "Salvar JSON"}
            </ActionButton>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {groups.length === 0 && searchFilter && (
            <EmptyState text={`Nenhuma seção encontrada para "${searchFilter}"`} />
          )}
          {groups.map((groupKey) => {
            const groupValue = cfgToRender[groupKey];
            const isOpen = expandedGroups.has(groupKey);
            const groupSchema = schema?.properties?.[groupKey] || schema?.[groupKey] || {};
            const meta = SECTION_META[groupKey];
            const groupLabel = meta?.label || groupSchema?.label || groupSchema?.title || groupKey;
            const groupDesc = meta?.description || groupSchema?.description || "";
            const fieldCount = typeof groupValue === "object" && groupValue !== null && !Array.isArray(groupValue)
              ? Object.keys(groupValue).length
              : 1;

            return (
              <div key={groupKey} className="rounded-xl border border-zinc-800 bg-zinc-900/30">
                <button
                  onClick={() => toggleGroup(groupKey)}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-[13px] font-medium text-zinc-200">{groupLabel}</div>
                      <span className="font-mono text-[9px] text-zinc-600">{groupKey}</span>
                    </div>
                    {groupDesc && !isOpen && (
                      <div className="mt-0.5 truncate text-[11px] text-zinc-500">{groupDesc}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-600">{fieldCount}</span>
                    <svg
                      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className={`text-zinc-500 transition ${isOpen ? "rotate-180" : ""}`}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-zinc-800 px-2.5 pb-2.5 pt-2">
                    {typeof groupValue === "object" && groupValue !== null && !Array.isArray(groupValue) ? (
                      <div className="space-y-1.5">
                        {Object.entries(groupValue as AnyData).map(([key, val]) => {
                          const fieldSchema = groupSchema?.properties?.[key] || {};
                          const fieldPath = `${groupKey}.${key}`;

                          return (
                            <ConfigField
                              key={key}
                              path={fieldPath}
                              value={val}
                              schema={fieldSchema}
                              onChange={handleFieldChange}
                              depth={0}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <ConfigField
                        path={groupKey}
                        value={groupValue}
                        schema={groupSchema}
                        onChange={handleFieldChange}
                        depth={0}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============ Models Section ============

function ModelsSection({ clientRef }: { clientRef: React.RefObject<OpenClawClient | null> }) {
  const { data, loading, error, refresh } = useRpc<AnyData>(clientRef, "models.list");

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBox message={error} onRetry={refresh} />;

  const models = (data?.models as AnyData[]) || [];

  return (
    <div>
      <SectionHeader title="Modelos" subtitle={`${models.length} modelos disponíveis no gateway`} />
      <div className="mb-4">
        <ActionButton onClick={refresh}>Atualizar</ActionButton>
      </div>

      {models.length === 0 ? (
        <EmptyState text="Nenhum modelo encontrado" />
      ) : (
        <div className="space-y-3">
          {models.map((model, i) => (
            <DataCard key={model.id || i}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-zinc-100">{model.name || model.id}</div>
                  <div className="mt-0.5 truncate font-mono text-[11px] text-zinc-500">{model.id}</div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {model.provider && <Badge>{model.provider}</Badge>}
                  {model.reasoning && <Badge color="violet">reasoning</Badge>}
                  {model.vision && <Badge color="blue">vision</Badge>}
                </div>
              </div>
              {(model.contextWindow || model.maxTokens) && (
                <div className="mt-2 flex gap-4 text-[11px] text-zinc-500">
                  {model.contextWindow && <span>Context: {model.contextWindow.toLocaleString()}</span>}
                  {model.maxTokens && <span>Max tokens: {model.maxTokens.toLocaleString()}</span>}
                </div>
              )}
            </DataCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Tools Section ============

function ToolsSection({ clientRef }: { clientRef: React.RefObject<OpenClawClient | null> }) {
  const { data, loading, error, refresh } = useRpc<AnyData>(clientRef, "tools.catalog");
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBox message={error} onRetry={refresh} />;

  const tools = (data?.tools as AnyData[]) || Object.values(data || {}).flat().filter((v): v is AnyData => typeof v === "object" && v !== null);

  return (
    <div>
      <SectionHeader title="Ferramentas" subtitle={`${tools.length} ferramentas no catálogo`} />
      <div className="mb-4">
        <ActionButton onClick={refresh}>Atualizar</ActionButton>
      </div>

      {tools.length === 0 ? (
        <EmptyState text="Nenhuma ferramenta encontrada" />
      ) : (
        <div className="space-y-2">
          {tools.map((tool, i) => {
            const id = `${tool.name || tool.id || "tool"}-${i}`;
            const isExpanded = expanded === id;
            return (
              <DataCard key={id}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : id)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-zinc-100">{tool.name || tool.id}</div>
                    {tool.description && (
                      <div className="mt-0.5 truncate text-[11px] text-zinc-500">{tool.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {tool.enabled !== undefined && (
                      <Badge color={tool.enabled ? "emerald" : "red"}>
                        {tool.enabled ? "ativo" : "inativo"}
                      </Badge>
                    )}
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className={`shrink-0 text-zinc-500 transition ${isExpanded ? "rotate-180" : ""}`}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </button>
                {isExpanded && (
                  <div className="mt-3 border-t border-zinc-800 pt-3">
                    <JsonViewer data={tool} />
                  </div>
                )}
              </DataCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============ Agents Section ============

function AgentsSection({ clientRef }: { clientRef: React.RefObject<OpenClawClient | null> }) {
  const { data, loading, error, refresh } = useRpc<AnyData>(clientRef, "agents.list");
  const [showCreate, setShowCreate] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: "", model: "", systemPrompt: "", description: "" });
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    const client = clientRef.current;
    if (!client || !newAgent.name) return;
    setCreating(true);
    try {
      await client.createAgent({
        name: newAgent.name,
        model: newAgent.model || undefined,
        systemPrompt: newAgent.systemPrompt || undefined,
        description: newAgent.description || undefined,
      });
      setNewAgent({ name: "", model: "", systemPrompt: "", description: "" });
      setShowCreate(false);
      refresh();
    } catch (e) {
      alert(`Erro: ${e}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (agentId: string) => {
    const client = clientRef.current;
    if (!client) return;
    if (!confirm(`Deletar agente ${agentId}?`)) return;
    try {
      await client.deleteAgent(agentId);
      refresh();
    } catch (e) {
      alert(`Erro: ${e}`);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBox message={error} onRetry={refresh} />;

  const agents = (data?.agents as AnyData[]) || [];

  return (
    <div>
      <SectionHeader title="Agentes" subtitle="Agentes configurados no gateway" />
      <div className="mb-4 flex gap-2">
        <ActionButton onClick={refresh}>Atualizar</ActionButton>
        <ActionButton onClick={() => setShowCreate(!showCreate)} variant="success">
          {showCreate ? "Cancelar" : "Novo agente"}
        </ActionButton>
      </div>

      {showCreate && (
        <DataCard className="mb-4">
          <div className="mb-3 text-sm font-medium text-zinc-200">Criar novo agente</div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nome do agente *"
              value={newAgent.name}
              onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-700"
            />
            <input
              type="text"
              placeholder="Modelo (ex: openai/gpt-4o)"
              value={newAgent.model}
              onChange={(e) => setNewAgent({ ...newAgent, model: e.target.value })}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-700"
            />
            <input
              type="text"
              placeholder="Descrição"
              value={newAgent.description}
              onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-700"
            />
            <textarea
              placeholder="System prompt"
              value={newAgent.systemPrompt}
              onChange={(e) => setNewAgent({ ...newAgent, systemPrompt: e.target.value })}
              rows={3}
              className="w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-700"
            />
            <ActionButton onClick={handleCreate} variant="success" disabled={creating || !newAgent.name}>
              {creating ? "Criando..." : "Criar agente"}
            </ActionButton>
          </div>
        </DataCard>
      )}

      {agents.length === 0 && !showCreate ? (
        <EmptyState text="Nenhum agente encontrado" />
      ) : (
        <div className="space-y-3">
          {agents.map((agent, i) => (
            <DataCard key={agent.id || i}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-zinc-100">{agent.name || agent.id}</div>
                  {agent.description && <div className="mt-0.5 text-[11px] text-zinc-500">{agent.description}</div>}
                </div>
                <div className="flex items-center gap-1.5">
                  {agent.model && <Badge color="violet">{agent.model}</Badge>}
                  {agent.status && <Badge color={agent.status === "active" ? "emerald" : "zinc"}>{agent.status}</Badge>}
                  <ActionButton onClick={() => handleDelete(agent.id)} variant="danger">Deletar</ActionButton>
                </div>
              </div>
              {agent.systemPrompt && (
                <div className="mt-2 rounded-lg bg-zinc-950 p-2 text-[11px] text-zinc-500">
                  {agent.systemPrompt.slice(0, 200)}{agent.systemPrompt.length > 200 ? "..." : ""}
                </div>
              )}
            </DataCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Skills Section ============

function SkillsSection({ clientRef }: { clientRef: React.RefObject<OpenClawClient | null> }) {
  const { data, loading, error, refresh } = useRpc<AnyData>(clientRef, "skills.status");
  const [showInstall, setShowInstall] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: "", url: "", description: "" });
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    const client = clientRef.current;
    if (!client || (!newSkill.name && !newSkill.url)) return;
    setInstalling(true);
    try {
      await client.installSkill({
        name: newSkill.name || undefined,
        url: newSkill.url || undefined,
        description: newSkill.description || undefined,
      });
      setNewSkill({ name: "", url: "", description: "" });
      setShowInstall(false);
      refresh();
    } catch (e) {
      alert(`Erro: ${e}`);
    } finally {
      setInstalling(false);
    }
  };

  const handleUninstall = async (skillId: string) => {
    const client = clientRef.current;
    if (!client) return;
    if (!confirm(`Desinstalar skill ${skillId}?`)) return;
    try {
      await client.updateSkill({ skillId, enabled: false });
      refresh();
    } catch (e) {
      alert(`Erro: ${e}`);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBox message={error} onRetry={refresh} />;

  const skills = (data?.skills as AnyData[]) || [];

  return (
    <div>
      <SectionHeader title="Skills" subtitle="Skills instaladas no gateway" />
      <div className="mb-4 flex gap-2">
        <ActionButton onClick={refresh}>Atualizar</ActionButton>
        <ActionButton onClick={() => setShowInstall(!showInstall)} variant="success">
          {showInstall ? "Cancelar" : "Instalar skill"}
        </ActionButton>
      </div>

      {showInstall && (
        <DataCard className="mb-4">
          <div className="mb-3 text-sm font-medium text-zinc-200">Instalar skill</div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nome da skill"
              value={newSkill.name}
              onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-700"
            />
            <input
              type="text"
              placeholder="URL do pacote (opcional)"
              value={newSkill.url}
              onChange={(e) => setNewSkill({ ...newSkill, url: e.target.value })}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-700"
            />
            <input
              type="text"
              placeholder="Descrição (opcional)"
              value={newSkill.description}
              onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-700"
            />
            <ActionButton onClick={handleInstall} variant="success" disabled={installing || (!newSkill.name && !newSkill.url)}>
              {installing ? "Instalando..." : "Instalar"}
            </ActionButton>
          </div>
        </DataCard>
      )}

      {skills.length === 0 && !showInstall ? (
        <EmptyState text="Nenhuma skill encontrada" />
      ) : (
        <div className="space-y-3">
          {skills.map((skill, i) => (
            <DataCard key={skill.id || i}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-zinc-100">{skill.name || skill.id}</div>
                  {skill.description && <div className="mt-0.5 text-[11px] text-zinc-500">{skill.description}</div>}
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge color={skill.installed ? "emerald" : "zinc"}>
                    {skill.installed ? "instalada" : "disponível"}
                  </Badge>
                  {skill.installed && (
                    <ActionButton onClick={() => handleUninstall(skill.id || skill.name)} variant="danger">
                      Desinstalar
                    </ActionButton>
                  )}
                </div>
              </div>
            </DataCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Devices Section ============

function DevicesSection({ clientRef }: { clientRef: React.RefObject<OpenClawClient | null> }) {
  const { data, loading, error, refresh } = useRpc<AnyData>(clientRef, "device.pair.list");

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBox message={error} onRetry={refresh} />;

  const paired = (data?.paired as AnyData[]) || [];

  const handleRevoke = async (deviceId: string) => {
    const client = clientRef.current;
    if (!client) return;
    if (!confirm(`Revogar dispositivo ${deviceId}?`)) return;
    try {
      await client.revokeDevice(deviceId);
      refresh();
    } catch (e) {
      alert(`Erro: ${e}`);
    }
  };

  return (
    <div>
      <SectionHeader title="Dispositivos" subtitle={`${paired.length} dispositivos pareados`} />
      <div className="mb-4">
        <ActionButton onClick={refresh}>Atualizar</ActionButton>
      </div>

      {paired.length === 0 ? (
        <EmptyState text="Nenhum dispositivo pareado" />
      ) : (
        <div className="space-y-3">
          {paired.map((device, i) => (
            <DataCard key={device.deviceId || i}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-zinc-100">{device.clientId || "Desconhecido"}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-zinc-500">{device.deviceId}</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {device.platform && <Badge>{device.platform}</Badge>}
                    {device.role && <Badge color="violet">{device.role}</Badge>}
                    {device.mode && <Badge color="blue">{device.mode}</Badge>}
                  </div>
                  {device.scopes && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(device.scopes as string[]).map((s: string) => (
                        <span key={s} className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-500">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <ActionButton onClick={() => handleRevoke(device.deviceId)} variant="danger">
                  Revogar
                </ActionButton>
              </div>
            </DataCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Sessions Section ============

function SessionsSection({ clientRef }: { clientRef: React.RefObject<OpenClawClient | null> }) {
  const { data, loading, error, refresh } = useRpc<AnyData>(clientRef, "sessions.list");
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBox message={error} onRetry={refresh} />;

  const sessions = (data?.sessions as AnyData[]) || [];

  return (
    <div>
      <SectionHeader title="Sessões" subtitle={`${sessions.length} sessões no gateway`} />
      <div className="mb-4">
        <ActionButton onClick={refresh}>Atualizar</ActionButton>
      </div>

      {sessions.length === 0 ? (
        <EmptyState text="Nenhuma sessão encontrada" />
      ) : (
        <div className="space-y-2">
          {sessions.map((session, i) => {
            const id = session.sessionKey || session.id || `sess-${i}`;
            const isExpanded = expanded === id;
            return (
              <DataCard key={id}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : id)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-zinc-100">{session.title || id}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-zinc-500">{id}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.messageCount !== undefined && (
                      <Badge>{session.messageCount} msgs</Badge>
                    )}
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className={`shrink-0 text-zinc-500 transition ${isExpanded ? "rotate-180" : ""}`}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </button>
                {isExpanded && (
                  <div className="mt-3 border-t border-zinc-800 pt-3">
                    <JsonViewer data={session} />
                  </div>
                )}
              </DataCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============ Cron Section ============

function CronSection({ clientRef }: { clientRef: React.RefObject<OpenClawClient | null> }) {
  const { data, loading, error, refresh } = useRpc<AnyData>(clientRef, "cron.list");
  const [showCreate, setShowCreate] = useState(false);
  const [newJob, setNewJob] = useState({ name: "", schedule: "", command: "", message: "" });
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    const client = clientRef.current;
    if (!client || !newJob.schedule) return;
    setCreating(true);
    try {
      await client.addCron({
        name: newJob.name || undefined,
        schedule: newJob.schedule,
        command: newJob.command || undefined,
        message: newJob.message || undefined,
      });
      setNewJob({ name: "", schedule: "", command: "", message: "" });
      setShowCreate(false);
      refresh();
    } catch (e) {
      alert(`Erro: ${e}`);
    } finally {
      setCreating(false);
    }
  };

  const handleRemove = async (jobId: string) => {
    const client = clientRef.current;
    if (!client) return;
    if (!confirm(`Remover cron job ${jobId}?`)) return;
    try {
      await client.removeCron(jobId);
      refresh();
    } catch (e) {
      alert(`Erro: ${e}`);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBox message={error} onRetry={refresh} />;

  const jobs = (data?.jobs as AnyData[]) || [];

  return (
    <div>
      <SectionHeader title="Cron Jobs" subtitle="Tarefas agendadas no gateway" />
      <div className="mb-4 flex gap-2">
        <ActionButton onClick={refresh}>Atualizar</ActionButton>
        <ActionButton onClick={() => setShowCreate(!showCreate)} variant="success">
          {showCreate ? "Cancelar" : "Novo cron job"}
        </ActionButton>
      </div>

      {showCreate && (
        <DataCard className="mb-4">
          <div className="mb-3 text-sm font-medium text-zinc-200">Criar cron job</div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nome (opcional)"
              value={newJob.name}
              onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-700"
            />
            <div>
              <input
                type="text"
                placeholder="Schedule * (ex: */5 * * * * ou @hourly)"
                value={newJob.schedule}
                onChange={(e) => setNewJob({ ...newJob, schedule: e.target.value })}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-700"
              />
              <div className="mt-1 px-1 text-[10px] text-zinc-600">Formato cron: min hora dia mês diasemana</div>
            </div>
            <input
              type="text"
              placeholder="Comando shell (opcional)"
              value={newJob.command}
              onChange={(e) => setNewJob({ ...newJob, command: e.target.value })}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-700"
            />
            <textarea
              placeholder="Mensagem para o agente (opcional)"
              value={newJob.message}
              onChange={(e) => setNewJob({ ...newJob, message: e.target.value })}
              rows={2}
              className="w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-700"
            />
            <ActionButton onClick={handleCreate} variant="success" disabled={creating || !newJob.schedule}>
              {creating ? "Criando..." : "Criar job"}
            </ActionButton>
          </div>
        </DataCard>
      )}

      {jobs.length === 0 && !showCreate ? (
        <EmptyState text="Nenhum cron job configurado" />
      ) : (
        <div className="space-y-3">
          {jobs.map((job, i) => (
            <DataCard key={job.id || i}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-zinc-100">{job.name || job.id}</div>
                  {job.schedule && <div className="mt-0.5 font-mono text-[11px] text-zinc-500">{typeof job.schedule === "string" ? job.schedule : JSON.stringify(job.schedule)}</div>}
                  {job.command && <div className="mt-1 text-[11px] text-zinc-400">{typeof job.command === "string" ? job.command : JSON.stringify(job.command)}</div>}
                  {job.message && <div className="mt-1 text-[11px] text-zinc-400">{typeof job.message === "string" ? job.message : JSON.stringify(job.message)}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={job.enabled !== false ? "emerald" : "red"}>
                    {job.enabled !== false ? "ativo" : "pausado"}
                  </Badge>
                  <ActionButton onClick={() => handleRemove(job.id)} variant="danger">
                    Remover
                  </ActionButton>
                </div>
              </div>
            </DataCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ TTS Section ============

function TTSSection({ clientRef }: { clientRef: React.RefObject<OpenClawClient | null> }) {
  const { data: voicesData, loading: vLoading, error: vError, refresh: vRefresh } = useRpc<AnyData>(clientRef, "tts.providers");
  const { data: configData, loading: cLoading, error: cError, refresh: cRefresh } = useRpc<AnyData>(clientRef, "tts.status");
  const [testText, setTestText] = useState("Olá, eu sou o LomboClaw!");
  const [testing, setTesting] = useState(false);

  const loading = vLoading || cLoading;
  const error = vError || cError;
  const refresh = () => { vRefresh(); cRefresh(); };

  const handleTest = async (voiceId?: string) => {
    const client = clientRef.current;
    if (!client || !testText) return;
    setTesting(true);
    try {
      await client.ttsSpeak(testText, voiceId);
    } catch (e) {
      alert(`Erro TTS: ${e}`);
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBox message={error} onRetry={refresh} />;

  const voices = (voicesData?.voices as AnyData[]) || [];
  const config = configData;

  return (
    <div>
      <SectionHeader title="Text-to-Speech" subtitle="Vozes e configuração de TTS" />
      <div className="mb-4 flex gap-2">
        <ActionButton onClick={refresh}>Atualizar</ActionButton>
      </div>

      {/* Test TTS */}
      <DataCard className="mb-5">
        <div className="mb-2 text-sm font-medium text-zinc-200">Testar TTS</div>
        <div className="flex gap-2">
          <input
            type="text"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Texto para sintetizar..."
            className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-700"
          />
          <ActionButton onClick={() => handleTest()} variant="success" disabled={testing || !testText}>
            {testing ? "Falando..." : "Falar"}
          </ActionButton>
        </div>
      </DataCard>

      {/* Config */}
      {config && (
        <DataCard className="mb-5">
          <div className="mb-2 text-sm font-medium text-zinc-200">Configuração TTS</div>
          <JsonViewer data={config} />
        </DataCard>
      )}

      {/* Voices */}
      <div className="mb-3 text-sm font-medium text-zinc-200">Vozes disponíveis ({voices.length})</div>
      {voices.length === 0 ? (
        <EmptyState text="Nenhuma voz encontrada" />
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {voices.map((voice, i) => (
            <DataCard key={voice.id || voice.name || i}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-zinc-100">{voice.name || voice.id}</div>
                  {voice.language && <div className="mt-0.5 text-[11px] text-zinc-500">{voice.language}</div>}
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {voice.gender && <Badge>{voice.gender}</Badge>}
                    {voice.provider && <Badge color="violet">{voice.provider}</Badge>}
                    {voice.style && <Badge color="blue">{voice.style}</Badge>}
                  </div>
                </div>
                <ActionButton onClick={() => handleTest(voice.id || voice.name)} disabled={testing}>
                  Testar
                </ActionButton>
              </div>
            </DataCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Approvals Section ============

function ApprovalsSection({ clientRef }: { clientRef: React.RefObject<OpenClawClient | null> }) {
  const { data, loading, error, refresh } = useRpc<AnyData>(clientRef, "exec.approvals.get");

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBox message={error} onRetry={refresh} />;

  const pending = (data?.pending as AnyData[]) || (data?.requests as AnyData[]) || [];

  const handleAction = async (requestId: string, action: "approve" | "deny") => {
    const client = clientRef.current;
    if (!client) return;
    try {
      await client.resolveApproval(requestId, action === "approve");
      refresh();
    } catch (e) {
      alert(`Erro: ${e}`);
    }
  };

  return (
    <div>
      <SectionHeader title="Aprovações" subtitle="Comandos pendentes de aprovação" />
      <div className="mb-4">
        <ActionButton onClick={refresh}>Atualizar</ActionButton>
      </div>

      {pending.length === 0 ? (
        <EmptyState text="Nenhuma aprovação pendente" />
      ) : (
        <div className="space-y-3">
          {pending.map((req, i) => (
            <DataCard key={req.requestId || req.id || i}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-zinc-100">{req.command || req.tool || "Comando"}</div>
                  {req.description && <div className="mt-0.5 text-[11px] text-zinc-500">{req.description}</div>}
                  {req.args && (
                    <pre className="mt-2 rounded-lg bg-zinc-950 p-2 font-mono text-[11px] text-zinc-400">
                      {typeof req.args === "string" ? req.args : JSON.stringify(req.args, null, 2)}
                    </pre>
                  )}
                </div>
                <div className="flex gap-2">
                  <ActionButton onClick={() => handleAction(req.requestId || req.id, "approve")} variant="success">
                    Aprovar
                  </ActionButton>
                  <ActionButton onClick={() => handleAction(req.requestId || req.id, "deny")} variant="danger">
                    Negar
                  </ActionButton>
                </div>
              </div>
            </DataCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ System Section ============

function SystemSection({ clientRef }: { clientRef: React.RefObject<OpenClawClient | null> }) {
  const [activeSubTab, setActiveSubTab] = useState<"health" | "usage" | "logs" | "update">("health");

  return (
    <div>
      <SectionHeader title="Sistema" subtitle="Status, uso, logs e atualizações" />

      <div className="mb-5 flex gap-2">
        {(["health", "usage", "logs", "update"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`rounded-lg px-3 py-1.5 text-xs transition ${
              activeSubTab === tab ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
            }`}
          >
            {{ health: "Saúde", usage: "Uso", logs: "Logs", update: "Atualização" }[tab]}
          </button>
        ))}
      </div>

      {activeSubTab === "health" && <HealthSubSection clientRef={clientRef} />}
      {activeSubTab === "usage" && <UsageSubSection clientRef={clientRef} />}
      {activeSubTab === "logs" && <LogsSubSection clientRef={clientRef} />}
      {activeSubTab === "update" && <UpdateSubSection clientRef={clientRef} />}
    </div>
  );
}

function HealthSubSection({ clientRef }: { clientRef: React.RefObject<OpenClawClient | null> }) {
  const { data: health, loading: hLoading, error: hError, refresh: hRefresh } = useRpc<AnyData>(clientRef, "health");
  const { data: status, loading: sLoading, error: sError, refresh: sRefresh } = useRpc<AnyData>(clientRef, "health");

  const loading = hLoading || sLoading;
  const error = hError || sError;
  const refresh = () => { hRefresh(); sRefresh(); };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBox message={error} onRetry={refresh} />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <ActionButton onClick={refresh}>Atualizar</ActionButton>
      </div>

      {health && (
        <DataCard>
          <div className="mb-2 text-sm font-medium text-zinc-200">Health</div>
          <JsonViewer data={health} />
        </DataCard>
      )}

      {status && (
        <DataCard>
          <div className="mb-2 text-sm font-medium text-zinc-200">Status</div>
          <JsonViewer data={status} />
        </DataCard>
      )}
    </div>
  );
}

function UsageSubSection({ clientRef }: { clientRef: React.RefObject<OpenClawClient | null> }) {
  const { data, loading, error, refresh } = useRpc<AnyData>(clientRef, "usage.status");

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBox message={error} onRetry={refresh} />;

  return (
    <div>
      <div className="mb-4">
        <ActionButton onClick={refresh}>Atualizar</ActionButton>
      </div>
      {data ? <JsonViewer data={data} maxHeight="60vh" /> : <EmptyState text="Sem dados de uso" />}
    </div>
  );
}

function LogsSubSection({ clientRef }: { clientRef: React.RefObject<OpenClawClient | null> }) {
  const [logs, setLogs] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;
    setLoading(true);
    setError(null);
    try {
      const result = await client.tailLogs(100) as AnyData;
      const text = result?.logs || result?.lines?.join?.("\n") || JSON.stringify(result, null, 2);
      setLogs(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [clientRef]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBox message={error} onRetry={fetchLogs} />;

  return (
    <div>
      <div className="mb-4">
        <ActionButton onClick={fetchLogs}>Atualizar</ActionButton>
      </div>
      {logs ? (
        <pre className="max-h-[60vh] overflow-auto rounded-xl bg-zinc-950 p-4 font-mono text-[11px] leading-relaxed text-zinc-400">
          {logs}
        </pre>
      ) : (
        <EmptyState text="Sem logs" />
      )}
    </div>
  );
}

function UpdateSubSection({ clientRef }: { clientRef: React.RefObject<OpenClawClient | null> }) {
  const { data, loading, error, refresh } = useRpc<AnyData>(clientRef, "health");
  const [updating, setUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<string | null>(null);

  const runUpdate = async () => {
    const client = clientRef.current;
    if (!client) return;
    if (!confirm("Executar atualização do gateway?")) return;
    setUpdating(true);
    try {
      const result = await client.runUpdate();
      setUpdateResult(JSON.stringify(result, null, 2));
    } catch (e) {
      setUpdateResult(`Erro: ${e}`);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBox message={error} onRetry={refresh} />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <ActionButton onClick={refresh}>Verificar</ActionButton>
        <ActionButton onClick={runUpdate} variant="success" disabled={updating}>
          {updating ? "Atualizando..." : "Atualizar gateway"}
        </ActionButton>
      </div>

      {data && (
        <DataCard>
          <div className="mb-2 text-sm font-medium text-zinc-200">Status da atualização</div>
          <JsonViewer data={data} />
        </DataCard>
      )}

      {updateResult && (
        <DataCard>
          <div className="mb-2 text-sm font-medium text-zinc-200">Resultado</div>
          <pre className="overflow-auto rounded-xl bg-zinc-950 p-3 font-mono text-[11px] text-zinc-400">{updateResult}</pre>
        </DataCard>
      )}
    </div>
  );
}
