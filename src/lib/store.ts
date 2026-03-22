import { create } from "zustand";
import { ChatMessage, ToolCall } from "./openclaw-client";

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

interface StreamingState {
  runId: string;
  content: string;
  thinking: string;
  toolCalls: ToolCall[];
}

interface AppState {
  // Connection
  connectionState: "connecting" | "connected" | "disconnected" | "error";
  setConnectionState: (state: AppState["connectionState"]) => void;

  // Sessions
  sessions: ChatSession[];
  activeSessionId: string | null;
  createSession: (id: string) => void;
  setActiveSession: (id: string) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  resetSession: (id: string, title?: string) => void;

  // Messages
  addMessage: (sessionId: string, msg: ChatMessage) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;

  // Streaming
  streaming: StreamingState | null;
  setStreaming: (s: StreamingState | null) => void;
  appendDelta: (runId: string, content: string) => void;
  appendThinking: (runId: string, thinking: string) => void;
  setThinkingFull: (runId: string, fullText: string) => void;
  addToolCall: (runId: string, tool: ToolCall) => void;
  updateToolCall: (runId: string, toolId: string, update: Partial<ToolCall>) => void;

  // UI
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  inputValue: string;
  setInputValue: (v: string) => void;
  selectedModel: string | null;
  setSelectedModel: (model: string | null) => void;
}

// ---- localStorage persistence ----
const STORAGE_KEY = "openclaw-sessions";

function loadSessions(): { sessions: ChatSession[]; activeSessionId: string | null; selectedModel: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { sessions: [], activeSessionId: null, selectedModel: null };
    const data = JSON.parse(raw);
    const sessions: ChatSession[] = Array.isArray(data.sessions) ? data.sessions : [];
    const activeSessionId: string | null = data.activeSessionId ?? sessions[0]?.id ?? null;
    const selectedModel: string | null = data.selectedModel ?? null;
    return { sessions, activeSessionId, selectedModel };
  } catch {
    return { sessions: [], activeSessionId: null, selectedModel: null };
  }
}

function saveSessions(sessions: ChatSession[], activeSessionId: string | null, selectedModel: string | null) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessions, activeSessionId, selectedModel }));
  } catch {
    // quota exceeded or SSR - ignore
  }
}

// Helper: call after any mutation to sessions/activeSessionId
function persistAfterSet(get: () => AppState) {
  // Use queueMicrotask so zustand state is already updated
  queueMicrotask(() => {
    const { sessions, activeSessionId, selectedModel } = get();
    saveSessions(sessions, activeSessionId, selectedModel);
  });
}

export const useAppStore = create<AppState>((set, get) => ({
  // Connection
  connectionState: "disconnected",
  setConnectionState: (connectionState) => set({ connectionState }),

  // Sessions
  sessions: [],
  activeSessionId: null,

  createSession: (id) => {
    const session: ChatSession = {
      id,
      title: "Nova conversa",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((s) => ({
      sessions: [session, ...s.sessions],
      activeSessionId: id,
    }));
    persistAfterSet(get);
  },

  setActiveSession: (id) => {
    set({ activeSessionId: id });
    persistAfterSet(get);
  },

  deleteSession: (id) => {
    set((s) => {
      const sessions = s.sessions.filter((ss) => ss.id !== id);
      const activeSessionId =
        s.activeSessionId === id ? (sessions[0]?.id ?? null) : s.activeSessionId;
      return { sessions, activeSessionId };
    });
    persistAfterSet(get);
  },

  renameSession: (id, title) => {
    set((s) => ({
      sessions: s.sessions.map((ss) => (ss.id === id ? { ...ss, title } : ss)),
    }));
    persistAfterSet(get);
  },

  resetSession: (id, title = "Nova conversa") => {
    set((s) => ({
      sessions: s.sessions.map((ss) =>
        ss.id === id
          ? { ...ss, title, messages: [], updatedAt: Date.now() }
          : ss
      ),
      activeSessionId: id,
    }));
    persistAfterSet(get);
  },

  // Messages
  addMessage: (sessionId, msg) => {
    set((s) => ({
      sessions: s.sessions.map((ss) =>
        ss.id === sessionId
          ? { ...ss, messages: [...ss.messages, msg], updatedAt: Date.now() }
          : ss
      ),
    }));
    // Auto-title from first user message
    const session = get().sessions.find((ss) => ss.id === sessionId);
    if (session && session.messages.length === 1 && msg.role === "user") {
      const title = msg.content.slice(0, 50) + (msg.content.length > 50 ? "..." : "");
      get().renameSession(sessionId, title);
    }
    persistAfterSet(get);
  },

  updateSessionTitle: (sessionId, title) => {
    set((s) => ({
      sessions: s.sessions.map((ss) => (ss.id === sessionId ? { ...ss, title } : ss)),
    }));
    persistAfterSet(get);
  },

  // Streaming
  streaming: null,
  setStreaming: (streaming) => set({ streaming }),
  appendDelta: (runId, content) => {
    set((s) => {
      if (!s.streaming || s.streaming.runId !== runId) {
        return { streaming: { runId, content, thinking: "", toolCalls: [] } };
      }
      return {
        streaming: { ...s.streaming, content: s.streaming.content + content },
      };
    });
  },
  appendThinking: (runId, thinking) => {
    set((s) => {
      if (!s.streaming || s.streaming.runId !== runId) {
        return { streaming: { runId, content: "", thinking, toolCalls: [] } };
      }
      return {
        streaming: { ...s.streaming, thinking: s.streaming.thinking + thinking },
      };
    });
  },
  setThinkingFull: (runId, fullText) => {
    set((s) => {
      if (!s.streaming || s.streaming.runId !== runId) {
        return { streaming: { runId, content: "", thinking: fullText, toolCalls: [] } };
      }
      return {
        streaming: { ...s.streaming, thinking: fullText },
      };
    });
  },
  addToolCall: (runId, tool) => {
    set((s) => {
      if (!s.streaming) {
        return { streaming: { runId, content: "", thinking: "", toolCalls: [tool] } };
      }
      return {
        streaming: {
          ...s.streaming,
          toolCalls: [...s.streaming.toolCalls, tool],
        },
      };
    });
  },
  updateToolCall: (runId, toolId, update) => {
    set((s) => {
      if (!s.streaming) return {};
      return {
        streaming: {
          ...s.streaming,
          toolCalls: s.streaming.toolCalls.map((t) =>
            t.id === toolId ? { ...t, ...update } : t
          ),
        },
      };
    });
  },

  // UI
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  inputValue: "",
  setInputValue: (inputValue) => set({ inputValue }),
  selectedModel: null,
  setSelectedModel: (selectedModel) => {
    set({ selectedModel });
    persistAfterSet(get);
  },
}));

// Hydrate from localStorage after mount (avoids SSR mismatch)
if (typeof window !== "undefined") {
  const saved = loadSessions();
  if (saved.sessions.length > 0) {
    useAppStore.setState(saved);
  }
}
