"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { GatewayModel } from "@/hooks/useGatewayInfo";
import { OpenClawClient } from "@/lib/openclaw-client";

interface ModelSelectorProps {
  models: GatewayModel[];
  clientRef: React.RefObject<OpenClawClient | null>;
}

export function ModelSelector({ models, clientRef }: ModelSelectorProps) {
  const { selectedModel, setSelectedModel } = useAppStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const unique = useMemo(
    () => models.filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i),
    [models]
  );
  const current = unique.find((m) => m.id === selectedModel) || unique[0];
  const filtered = unique.filter((m) =>
    m.id.toLowerCase().includes(search.toLowerCase()) ||
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.provider.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (unique.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex min-w-0 items-center gap-2 rounded-lg px-1 py-1 text-left transition hover:bg-zinc-900/60"
      >
        <span className="truncate text-[18px] font-medium text-zinc-100">{current?.name || current?.id || "Modelo"}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 text-zinc-500">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[340px] overflow-hidden rounded-2xl border border-zinc-800 bg-[#111112] shadow-2xl shadow-black/40">
          <div className="border-b border-zinc-800 p-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar modelo..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-700"
              autoFocus
            />
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-xs text-zinc-600">Nenhum modelo encontrado</p>
            ) : (
              filtered.map((model) => {
                const selected = model.id === (selectedModel || unique[0]?.id);
                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model.id);
                      setOpen(false);
                      setSearch("");
                      clientRef.current?.setModel(model.id).catch((e) =>
                        console.warn("[ModelSelector] Failed to set model:", e)
                      );
                    }}
                    className={`mb-1 w-full rounded-xl px-3 py-3 text-left transition-colors ${
                      selected ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${model.reasoning ? "bg-violet-400" : "bg-zinc-400"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{model.name || model.id}</div>
                        <div className="truncate font-mono text-[11px] text-zinc-500">{model.id}</div>
                      </div>
                      {selected && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" className="shrink-0">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
