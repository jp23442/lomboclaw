"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";

export function LoginScreen() {
  const login = useAppStore((s) => s.login);
  const [url, setUrl] = useState(() => {
    if (typeof window === "undefined") return "ws://localhost:18789";
    const host = window.location.hostname;
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${host}:18789`;
  });
  const [password, setPassword] = useState("");
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);
    setTesting(true);

    try {
      // Quick connectivity test via WebSocket
      const ws = new WebSocket(url);
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error("Timeout — gateway não respondeu em 5s"));
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timeout);
          ws.close();
          resolve();
        };
        ws.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("Não foi possível conectar ao gateway"));
        };
      });

      login(url, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#0a0a0b] text-zinc-100">
      <div className="w-full max-w-[380px] px-6">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-900/30">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-zinc-100">LomboClaw</h1>
          <p className="mt-1 text-[13px] text-zinc-500">Conecte ao gateway OpenClaw</p>
        </div>

        {/* Form */}
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-zinc-400">Gateway URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="ws://localhost:18789"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-[13px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-zinc-600"
              spellCheck={false}
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-zinc-400">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleConnect(); }}
              placeholder="Senha do gateway (opcional)"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-[13px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-zinc-600"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-[12px] text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={testing || !url.trim()}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-[13px] font-medium text-white transition hover:bg-emerald-500 disabled:opacity-40"
          >
            {testing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                  <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Conectando...
              </span>
            ) : (
              "Conectar"
            )}
          </button>
        </div>

        {/* Help */}
        <p className="mt-6 text-center text-[11px] text-zinc-600">
          O gateway deve estar rodando para conectar.
          <br />
          Autenticação por senha ou device pairing.
        </p>
      </div>
    </div>
  );
}
