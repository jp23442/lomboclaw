"use client";

import { useEffect, useRef, useCallback } from "react";
import { OpenClawClient, ChatMessage } from "@/lib/openclaw-client";
import { useAppStore } from "@/lib/store";

function getGatewayUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_OPENCLAW_URL;
  if (envUrl) return envUrl;
  if (typeof window === "undefined") return "ws://localhost:18789";
  const host = window.location.hostname;
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${host}:18789`;
}

const GATEWAY_PASSWORD = process.env.NEXT_PUBLIC_OPENCLAW_PASSWORD || "";

export function useOpenClaw() {
  const clientRef = useRef<OpenClawClient | null>(null);
  const store = useAppStore();

  useEffect(() => {
    const client = new OpenClawClient({
      url: getGatewayUrl(),
      password: GATEWAY_PASSWORD,
    });

    client.onStateChange = (state) => {
      store.setConnectionState(state);
    };

    client.onDelta = (runId, content) => {
      store.appendDelta(runId, content);
    };

    client.onThinking = (runId, thinking) => {
      store.appendThinking(runId, thinking);
    };

    client.onMessage = (msg: ChatMessage) => {
      const activeId = useAppStore.getState().activeSessionId;
      if (!activeId) return;

      const streaming = useAppStore.getState().streaming;
      if (streaming) {
        if (streaming.toolCalls.length > 0) {
          msg.toolCalls = streaming.toolCalls;
        }
        if (streaming.thinking && !msg.thinking) {
          msg.thinking = streaming.thinking;
        }
      }

      store.setStreaming(null);
      store.addMessage(activeId, msg);
    };

    client.onToolCall = (runId, tool) => {
      store.addToolCall(runId, tool);
    };

    client.onToolResult = (runId, toolId, output) => {
      store.updateToolCall(runId, toolId, { output, state: "done" });
    };

    client.connect();
    clientRef.current = client;

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = useCallback(async (text: string, attachments?: { type: string; mimeType: string; content: string }[]) => {
    const client = clientRef.current;
    if (!client || !client.isConnected()) return;

    const trimmed = text.trim();
    const normalized = trimmed.toLowerCase();
    let activeId = useAppStore.getState().activeSessionId;

    if (!attachments?.length && trimmed.startsWith("/")) {
      if (normalized === "/reset" || normalized === "/new") {
        const newKey = client.newSession();
        store.createSession(newKey);
        store.addMessage(newKey, {
          id: `system-${Date.now()}`,
          role: "system",
          content: `Sessao resetada via ${normalized}. Contexto limpo e pronto para nova conversa.`,
          timestamp: Date.now(),
          state: "final",
        });
        store.setInputValue("");
        return;
      }

      if (normalized === "/help" || normalized === "/?") {
        if (!activeId) {
          const newKey = client.newSession();
          store.createSession(newKey);
          activeId = newKey;
        }
        store.addMessage(activeId, {
          id: `system-${Date.now()}`,
          role: "system",
          content: "Comandos locais:\n/reset ou /new -> abre sessao nova\n/help -> mostra esta ajuda\n\nObs: este GUI fala direto com o Gateway via WebSocket.",
          timestamp: Date.now(),
          state: "final",
        });
        store.setInputValue("");
        return;
      }
    }

    if (!activeId) {
      const newKey = client.newSession();
      store.createSession(newKey);
      activeId = newKey;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    store.addMessage(activeId, userMsg);
    store.setInputValue("");

    try {
      const selectedModel = useAppStore.getState().selectedModel;
      await client.sendMessage(text, attachments, selectedModel);
    } catch (e) {
      console.error("[OpenClaw] Send failed:", e);
      store.addMessage(activeId, {
        id: `error-${Date.now()}`,
        role: "system",
        content: `Erro ao enviar: ${e}`,
        timestamp: Date.now(),
        state: "error",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abortRun = useCallback(async () => {
    const client = clientRef.current;
    if (client) await client.abortRun();
    store.setStreaming(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const newChat = useCallback(() => {
    const client = clientRef.current;
    if (!client) return;
    const key = client.newSession();
    store.createSession(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { sendMessage, abortRun, newChat, clientRef };
}
