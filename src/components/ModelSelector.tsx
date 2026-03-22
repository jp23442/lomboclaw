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
        className="flex min-w-0 items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-all duration-200 hover:bg-white/[0.04] active:scale-[0.98]"
      >
        <span className="truncate text-[18px] font-semibold bg-gradient-to-r from-zinc-100 to-zinc-300 bg-clip-text text-transparent">{current?.name || current?.id || "Modelo"}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`shrink-0 text-zinc-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-3 w-[360px] overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0f0f11] shadow-2xl shadow-black/60 backdrop-blur-xl scale-in">
          <div className="border-b border-white/[0.04] p-4">
            <div className="relative">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar modelo..."
                className="w-full rounded-xl border border-white/[0.04] bg-white/[0.02] pl-10 pr-4 py-2.5 text-sm text-zinc-100 outline-none transition-all duration-200 focus:border-white/[0.08] focus:bg-white/[0.03]"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-xs text-zinc-600">Nenhum modelo encontrado</p>
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
                    className={`mb-1 w-full rounded-xl px-4 py-3.5 text-left transition-all duration-200 ${
                      selected ? "bg-white/[0.06] text-zinc-100 border border-white/[0.06]" : "text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200 border border-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full shadow-lg ${model.reasoning ? "bg-violet-400 shadow-violet-400/30" : "bg-emerald-400 shadow-emerald-400/30"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium">{model.name || model.id}</div>
                        <div className="truncate font-mono text-[11px] text-zinc-600 mt-0.5">{model.id}</div>
                      </div>
                      {selected && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" className="shrink-0 mt-0.5">
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
