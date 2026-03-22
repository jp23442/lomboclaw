"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { GatewayModel } from "@/hooks/useGatewayInfo";

interface ModelSelectorProps {
  models: GatewayModel[];
}

export function ModelSelector({ models }: ModelSelectorProps) {
  const { selectedModel, setSelectedModel } = useAppStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const current = models.find((m) => m.id === selectedModel) || models[0];
  const filtered = models.filter((m) =>
    m.id.toLowerCase().includes(search.toLowerCase()) ||
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (models.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-zinc-200 hover:bg-zinc-800 transition-colors"
      >
        {current?.reasoning && (
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
        )}
        <span className="truncate max-w-[200px]">{current?.name || current?.id || "Modelo"}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 text-zinc-500">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-zinc-800">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar modelo..."
              className="w-full px-3 py-1.5 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
              autoFocus
            />
          </div>

          {/* Model list */}
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-zinc-600 text-center py-4">Nenhum modelo encontrado</p>
            ) : (
              filtered.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model.id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                    model.id === (selectedModel || models[0]?.id)
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    model.reasoning ? "bg-purple-500" : "bg-blue-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs truncate">{model.id}</div>
                    {model.provider && (
                      <div className="text-[10px] text-zinc-600">{model.provider}</div>
                    )}
                  </div>
                  {model.reasoning && (
                    <span className="text-[9px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded font-medium shrink-0">
                      Reasoning
                    </span>
                  )}
                  {model.id === (selectedModel || models[0]?.id) && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" className="shrink-0">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
