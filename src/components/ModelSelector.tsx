"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { GatewayModel } from "@/hooks/useGatewayInfo";
import { OpenClawClient } from "@/lib/openclaw-client";

interface ModelSelectorProps {
  models: GatewayModel[];
  clientRef: React.RefObject<OpenClawClient | null>;
}

function getModelSubtitle(model?: GatewayModel | null) {
  if (!model) return "Sem modelo selecionado";
  const bits = [model.provider || "local"];
  if (model.reasoning) bits.push("reasoning");
  return bits.join(" • ");
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
        className="group flex min-w-0 items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-900"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3a9 9 0 100 18 9 9 0 000-18Z" />
            <path d="M9.5 10a1.5 1.5 0 110 3 1.5 1.5 0 010-3Zm5 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3Z" />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-zinc-100">
            {current?.name || current?.id || "Modelo"}
          </div>
          <div className="truncate text-[11px] text-zinc-500">{getModelSubtitle(current)}</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ml-auto shrink-0 text-zinc-500 transition-transform group-data-[open=true]:rotate-180">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[340px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/40">
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
                    className={`mb-1 w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                      selected
                        ? "border-zinc-700 bg-zinc-900 text-zinc-100"
                        : "border-transparent bg-transparent text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900/70 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${model.reasoning ? "bg-violet-400" : "bg-emerald-400"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{model.name || model.id}</div>
                        <div className="truncate font-mono text-[11px] text-zinc-500">{model.id}</div>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {model.provider && (
                            <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
                              {model.provider}
                            </span>
                          )}
                          {model.reasoning && (
                            <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-300">
                              reasoning
                            </span>
                          )}
                        </div>
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
