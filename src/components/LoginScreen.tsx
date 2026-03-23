"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { LogoBox } from "./Logo";

export function LoginScreen() {
  const login = useAppStore((s) => s.login);
  const connectionState = useAppStore((s) => s.connectionState);
  const [url, setUrl] = useState("ws://localhost:18789");
  const [password, setPassword] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [detectedHost, setDetectedHost] = useState("localhost");

  // Set correct URL and host after hydration (avoids SSR mismatch)
  useEffect(() => {
    const host = window.location.hostname;
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    setUrl(`${proto}//${host}:18789`);
    setDetectedHost(host);
  }, []);

  // If we just got kicked back from an auth error, show it
  useEffect(() => {
    if (connectionState === "error" && connecting) {
      setError("Falha na autenticação — verifique a senha e URL");
      setConnecting(false);
    }
    if (connectionState === "connected" && connecting) {
      setConnecting(false);
    }
  }, [connectionState, connecting]);

  const handleConnect = () => {
    if (!url.trim()) return;
    setError(null);
    setConnecting(true);
    login(url.trim(), password);
  };

  const isLocalhost = detectedHost === "localhost" || detectedHost === "127.0.0.1";
  const isRemote = !isLocalhost && detectedHost !== "";

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-[#0a0a0b] p-4 text-zinc-100">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <LogoBox size={56} className="rounded-2xl shadow-lg shadow-emerald-900/30" />
          <h1 className="mt-3 text-2xl font-semibold text-zinc-100">LomboClaw</h1>
          <p className="mt-1 text-[13px] text-zinc-500">Conecte ao gateway OpenClaw</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Password - primary field for mobile */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-zinc-400">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleConnect(); }}
              placeholder="Senha do gateway"
              autoFocus
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-[15px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-zinc-600"
            />
          </div>

          {/* Gateway URL - collapsible for mobile */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-[12px] text-zinc-500 transition hover:text-zinc-300"
            >
              <svg
                width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                className={`transition ${showAdvanced ? "rotate-180" : ""}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
              Gateway URL
              {!showAdvanced && (
                <span className="ml-1 font-mono text-[10px] text-zinc-600 truncate max-w-[200px]">{url}</span>
              )}
            </button>
            {showAdvanced && (
              <input
                type="text"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(null); }}
                placeholder="ws://192.168.x.x:18789"
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 font-mono text-[13px] text-zinc-300 outline-none placeholder:text-zinc-600 focus:border-zinc-600"
                spellCheck={false}
              />
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-[13px] text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={connecting || !url.trim()}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3.5 text-[15px] font-semibold text-white transition hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40"
          >
            {connecting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
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

        {/* Connection hints */}
        <div className="mt-6 space-y-2">
          {isRemote && (
            <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 px-4 py-2.5 text-[11px] text-emerald-400/80">
              Conectando via rede: <span className="font-mono font-medium">{detectedHost}</span>
            </div>
          )}
          <p className="text-center text-[11px] text-zinc-600 leading-relaxed">
            {isLocalhost
              ? "Acessando localmente. Para conectar de outro dispositivo, acesse pelo IP da rede."
              : "O gateway deve estar rodando na máquina host."
            }
          </p>
        </div>
      </div>
    </div>
  );
}
