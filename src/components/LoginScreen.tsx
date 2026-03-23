"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { LogoBox } from "./Logo";

export function LoginScreen() {
  const login = useAppStore((s) => s.login);
  const connectionState = useAppStore((s) => s.connectionState);
  const [url, setUrl] = useState(() => {
    if (typeof window === "undefined") return "ws://localhost:18789";
    const host = window.location.hostname;
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${host}:18789`;
  });
  const [password, setPassword] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If we just got kicked back from an auth error, show it
  useEffect(() => {
    if (connectionState === "error" && connecting) {
      setError("Falha na autenticação — verifique a senha e URL");
      setConnecting(false);
    }
  }, [connectionState, connecting]);

  const handleConnect = () => {
    if (!url.trim()) return;
    setError(null);
    setConnecting(true);
    // Login triggers useOpenClaw to connect; if auth fails, onAuthError logs out
    // and we return to this screen with an error
    login(url.trim(), password);
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#0a0a0b] text-zinc-100">
      <div className="w-full max-w-[380px] px-6">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <LogoBox size={48} className="rounded-2xl shadow-lg shadow-emerald-900/30" />
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
              onChange={(e) => { setUrl(e.target.value); setError(null); }}
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
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
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
            disabled={connecting || !url.trim()}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-[13px] font-medium text-white transition hover:bg-emerald-500 disabled:opacity-40"
          >
            {connecting ? (
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
