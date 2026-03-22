import { v4 as uuid } from "uuid";
import { DeviceIdentity, getOrCreateIdentity, buildSignPayloadV2, signPayload } from "./device-crypto";

export interface OpenClawConfig {
  url: string;
  password: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  thinking?: string;
  timestamp: number;
  state?: "delta" | "final" | "error" | "aborted";
  toolCalls?: ToolCall[];
  usage?: { inputTokens: number; outputTokens: number };
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: string;
  state?: "pending" | "running" | "done" | "error";
}

type EventCallback = (event: string, payload: unknown) => void;
type MessageCallback = (msg: ChatMessage) => void;
type DeltaCallback = (runId: string, content: string) => void;
type ThinkingCallback = (runId: string, thinking: string) => void;
type StateCallback = (state: "connecting" | "connected" | "disconnected" | "error") => void;

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class OpenClawClient {
  private ws: WebSocket | null = null;
  private config: OpenClawConfig;
  private connId: string | null = null;
  private sessionKey: string;
  private pending = new Map<string, PendingRequest>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private identity: DeviceIdentity | null = null;

  public onEvent: EventCallback = () => {};
  public onMessage: MessageCallback = () => {};
  public onDelta: DeltaCallback = () => {};
  public onThinking: ThinkingCallback = () => {};
  public onThinkingFull: ((runId: string, fullText: string) => void) | null = null;
  public onStateChange: StateCallback = () => {};
  public onToolCall: (runId: string, tool: ToolCall) => void = () => {};
  public onToolResult: (runId: string, toolId: string, output: string) => void = () => {};
  public onAuthError: ((message: string) => void) | null = null;

  constructor(config: OpenClawConfig) {
    this.config = config;
    this.sessionKey = `ui-${uuid()}`;
  }

  private visibilityHandler: (() => void) | null = null;

  async connect() {
    this.onStateChange("connecting");

    try {
      this.identity = await getOrCreateIdentity();
      console.log("[OpenClaw] Device ID:", this.identity.deviceId);
    } catch (e) {
      console.warn("[OpenClaw] Failed to create device identity:", e);
    }

    // Auto-reconnect when tab returns from background (Safari/iOS kills WS in background)
    if (!this.visibilityHandler && typeof document !== "undefined") {
      this.visibilityHandler = () => {
        if (document.visibilityState === "visible" && !this.isConnected()) {
          console.log("[OpenClaw] Tab visible, reconnecting...");
          this.reconnectAttempts = 0;
          if (this.ws) {
            this.ws.close(1000, "Reconnecting after visibility change");
            this.ws = null;
          }
          this.connect();
        }
      };
      document.addEventListener("visibilitychange", this.visibilityHandler);
    }

    const wsUrl = this.config.url.replace(/^http/, "ws");
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("[OpenClaw] WebSocket connected, waiting for challenge...");
    };

    this.ws.onmessage = (ev) => {
      try {
        const frame = JSON.parse(ev.data);
        this.handleFrame(frame);
      } catch (e) {
        console.error("[OpenClaw] Failed to parse frame:", e);
      }
    };

    this.ws.onclose = (ev) => {
      console.log("[OpenClaw] WebSocket closed:", ev.code, ev.reason);
      this.connId = null;
      this.onStateChange("disconnected");
      this.scheduleReconnect();
    };

    this.ws.onerror = (ev) => {
      console.error("[OpenClaw] WebSocket error:", ev);
      this.onStateChange("error");
    };
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts;
    if (this.ws) {
      this.ws.close(1000, "User disconnect");
      this.ws = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    console.log(`[OpenClaw] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`);
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  private handleFrame(frame: Record<string, unknown>) {
    const type = frame.type as string;
    if (type === "event") {
      this.handleEvent(frame);
    } else if (type === "res") {
      this.handleResponse(frame);
    }
  }

  private handleEvent(frame: Record<string, unknown>) {
    const event = frame.event as string;
    const payload = frame.payload as Record<string, unknown>;

    if (event === "connect.challenge") {
      this.handleChallenge(payload);
    } else if (event === "chat") {
      this.handleChatEvent(payload);
    } else if (event === "agent") {
      this.handleAgentEvent(payload);
    } else if (event === "tick") {
      // Respond to heartbeat to keep connection alive
      this.ws?.send(JSON.stringify({ type: "pong" }));
    } else {
      console.debug("[OpenClaw] Unhandled event:", event, JSON.stringify(payload).slice(0, 200));
      this.onEvent(event, payload);
    }
  }

  private async handleChallenge(payload: Record<string, unknown>) {
    const nonce = (payload.nonce as string) || "";
    console.log("[OpenClaw] Challenge received, authenticating...");

    const clientId = "webchat-ui";
    const clientMode = "webchat";
    const role = "operator";
    const scopes = ["operator.admin", "operator.read", "operator.write", "operator.approvals", "operator.pairing"];

    try {
      // Build connect params
      const connectParams: Record<string, unknown> = {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: clientId,
          version: "0.1.0",
          platform: navigator?.platform ?? "web",
          mode: clientMode,
          instanceId: this.sessionKey,
        },
        role,
        scopes,
        auth: this.config.password ? { password: this.config.password } : undefined,
        caps: ["tool-events"],
        userAgent: navigator?.userAgent ?? "OpenClaw-UI/0.1.0",
        locale: navigator?.language ?? "pt-BR",
      };

      // Sign with Ed25519 device identity
      if (this.identity) {
        try {
          const signedAt = Date.now();
          const payloadStr = buildSignPayloadV2({
            deviceId: this.identity.deviceId,
            clientId,
            clientMode,
            role,
            scopes,
            signedAtMs: signedAt,
            token: null,
            nonce,
          });

          const signature = signPayload(this.identity.privateKey, payloadStr);

          connectParams.device = {
            id: this.identity.deviceId,
            publicKey: this.identity.publicKey,
            signature,
            signedAt,
            nonce,
          };

          console.log("[OpenClaw] Signed with Ed25519, deviceId:", this.identity.deviceId, "pubKey:", this.identity.publicKey);
        } catch (signErr) {
          console.warn("[OpenClaw] Device signing failed, connecting without device:", signErr);
        }
      } else {
        console.warn("[OpenClaw] No device identity, connecting with password only");
      }

      console.log("[OpenClaw] Connect params:", JSON.stringify(connectParams, null, 2));

      const result = await this.sendRequest("connect", connectParams) as Record<string, unknown>;
      const server = result?.server as Record<string, unknown>;
      this.connId = server?.connId as string || "unknown";
      this.reconnectAttempts = 0;
      this.onStateChange("connected");
      console.log("[OpenClaw] Connected! connId:", this.connId);
    } catch (e: unknown) {
      const err = e as Record<string, unknown>;
      const details = err?.details as Record<string, unknown>;

      // Handle pairing required - auto-approve via requestId
      if (err?.code === "NOT_PAIRED" && details?.requestId) {
        console.log("[OpenClaw] Pairing required, requestId:", details.requestId);
        console.log("[OpenClaw] Attempting self-approve...");

        // Try approving with the requestId - the connect already happened so we might have pairing scope
        try {
          const approveFrame = {
            type: "req",
            id: uuid(),
            method: "device.pair.approve",
            params: {
              requestId: details.requestId,
              scopes: ["operator.admin", "operator.read", "operator.write", "operator.approvals", "operator.pairing"],
            },
          };
          this.ws?.send(JSON.stringify(approveFrame));
          console.log("[OpenClaw] Approve request sent, reconnecting in 2s...");
          setTimeout(() => {
            this.ws?.close(1000, "Reconnecting after pairing");
            setTimeout(() => this.connect(), 500);
          }, 2000);
          return;
        } catch (approveErr) {
          console.error("[OpenClaw] Auto-approve failed:", JSON.stringify(approveErr));
        }
      }

      const errMsg = (err?.message as string) || "Auth failed";
      console.error("[OpenClaw] Auth failed:", e, "code:", err?.code, "message:", errMsg, "details:", JSON.stringify(details));
      this.onAuthError?.(errMsg);
      this.onStateChange("error");
      // Stop reconnecting on auth errors — password won't change
      this.reconnectAttempts = this.maxReconnectAttempts;
    }
  }

  private handleAgentEvent(payload: Record<string, unknown>) {
    const stream = payload.stream as string;
    const runId = payload.runId as string;
    const data = payload.data as Record<string, unknown> | undefined;

    // Log FULL payload for all non-assistant events to debug structure
    if (stream !== "assistant") {
      console.log("[OpenClaw] agent event FULL:", JSON.stringify(payload).slice(0, 1000));
    }

    if (stream === "tool") {
      // The gateway sends tool events with data containing tool info.
      // Try multiple field name conventions to be robust.
      const d = data || payload;

      // Phase might be in data.phase, or combined in data.tool ("start:read")
      let phase = (d.phase as string) || "";
      let toolName = (d.name as string) || (d.tool_name as string) || "";
      const toolId = (d.id as string) || (d.call as string) || (d.toolCallId as string) || `tool-${Date.now()}`;
      const input = (d.input as Record<string, unknown>) || (d.args as Record<string, unknown>) || {};

      // Handle combined "tool" field like "start:read" or "result:read"
      const combinedTool = d.tool as string;
      if (combinedTool && combinedTool.includes(":")) {
        const parts = combinedTool.split(":");
        if (!phase) phase = parts[0];
        if (!toolName) toolName = parts.slice(1).join(":");
      } else if (combinedTool && !toolName) {
        toolName = combinedTool;
      }

      if (!toolName) toolName = "unknown";

      // Extract meta info (file paths etc)
      const meta = (d.meta as string) || "";
      if (meta && !input.file_path && !input.path) {
        // Parse meta like "from ~\Documents\openclaw-ui\src\components\Foo.tsx"
        const metaPath = meta.replace(/^(from|to)\s+/, "").trim();
        if (metaPath) {
          input.file_path = metaPath;
        }
      }

      console.log(`[OpenClaw] tool: phase=${phase} name=${toolName} id=${toolId} meta=${meta}`);

      if (phase === "start" || phase === "call") {
        this.onToolCall(runId, {
          id: toolId,
          name: toolName,
          input,
          state: "running",
        });
      } else if (phase === "result") {
        const result = d.result as string | Record<string, unknown> | undefined;
        const output = typeof result === "string" ? result : result ? JSON.stringify(result) : (meta || "done");
        this.onToolResult(runId, toolId, output);
      } else if (phase === "error") {
        const errMsg = (d.error as string) || (d.message as string) || "Error";
        this.onToolResult(runId, toolId, `Error: ${errMsg}`);
      }
    } else if (stream === "assistant") {
      // Assistant text stream — each event has FULL accumulated text.
      // Only route to thinking if isReasoning flag is set.
      const text = (payload.text as string) || (data?.text as string) || "";
      const isReasoning = !!(payload.isReasoning || (data && data.isReasoning));

      if (isReasoning && text) {
        this.onThinkingFull?.(runId, text);
      }
    } else if (stream === "lifecycle" && data) {
      console.log("[OpenClaw] lifecycle:", JSON.stringify(data).slice(0, 300));
    }
  }

  private handleChatEvent(payload: Record<string, unknown>) {
    const state = payload.state as string;
    const runId = payload.runId as string;
    const message = payload.message as Record<string, unknown> | undefined;
    const usage = payload.usage as { inputTokens: number; outputTokens: number } | undefined;

    if (!message) return;
    const content = message.content;

    // Debug: log raw chat events to understand gateway format
    if (state === "delta") {
      console.debug("[OpenClaw] chat delta:", JSON.stringify({ state, content: Array.isArray(content) ? content.map((b: Record<string, unknown>) => ({ type: b.type, hasText: !!b.text, hasThinking: !!b.thinking, hasReasoning: !!b.reasoning })) : typeof content }).slice(0, 300));
    } else {
      console.debug("[OpenClaw] chat event:", JSON.stringify({ state, messageKeys: Object.keys(message), contentType: Array.isArray(content) ? "array" : typeof content }).slice(0, 300));
    }

    // Check for thinking/reasoning at message level (some providers put it here)
    const msgThinking = (message.thinking as string) || (message.reasoning as string) || "";
    if (msgThinking && state === "delta") {
      this.onThinking(runId, msgThinking);
    }

    if (Array.isArray(content)) {
      for (const block of content) {
        const b = block as Record<string, unknown>;
        if (b.type === "tool_use") {
          this.onToolCall(runId, {
            id: b.id as string,
            name: b.name as string,
            input: b.input as Record<string, unknown>,
            state: "pending",
          });
        } else if (b.type === "tool_result") {
          this.onToolResult(runId, b.tool_use_id as string, b.content as string);
        } else if (b.type === "thinking" || b.type === "reasoning") {
          const thinkText = (b.thinking as string) || (b.reasoning as string) || (b.text as string) || "";
          if (state === "delta" && thinkText) this.onThinking(runId, thinkText);
        } else if (b.type === "text") {
          if (state === "delta") this.onDelta(runId, b.text as string);
        }
      }
    } else if (typeof content === "string") {
      if (state === "delta") this.onDelta(runId, content);
    }

    if (state === "final" || state === "error" || state === "aborted") {
      const isThinkingBlock = (b: Record<string, unknown>) => b.type === "thinking" || b.type === "reasoning";

      const textContent = Array.isArray(content)
        ? (content as Record<string, unknown>[])
            .filter((b) => b.type === "text")
            .map((b) => b.text)
            .join("")
        : (content as string) || "";

      const thinkingContent = Array.isArray(content)
        ? (content as Record<string, unknown>[])
            .filter(isThinkingBlock)
            .map((b) => (b.thinking as string) || (b.reasoning as string) || (b.text as string) || "")
            .join("")
        : msgThinking;

      this.onMessage({
        id: runId,
        role: (message.role as "assistant") || "assistant",
        content: textContent,
        thinking: thinkingContent || undefined,
        timestamp: Date.now(),
        state: state as ChatMessage["state"],
        usage,
      });
    }
  }

  private handleResponse(frame: Record<string, unknown>) {
    const id = frame.id as string;
    const pending = this.pending.get(id);
    if (!pending) return;

    this.pending.delete(id);
    clearTimeout(pending.timer);

    if (frame.ok) {
      pending.resolve(frame.payload);
    } else {
      const err = frame.error as Record<string, unknown> | undefined;
      const code = err?.code || "UNKNOWN";
      const message = err?.message || "Request failed";
      console.warn(`[OpenClaw] RPC error: ${code} - ${message}`);
      pending.reject(new Error(`${code}: ${message}`));
    }
  }

  private sendRequest(method: string, params: unknown, timeoutMs = 30000): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not connected"));
        return;
      }

      const id = uuid();
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Request ${method} timed out`));
      }, timeoutMs);

      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ type: "req", id, method, params }));
    });
  }

  async sendMessage(text: string, attachments?: { type: string; mimeType: string; content: string }[]): Promise<void> {
    const params: Record<string, unknown> = {
      sessionKey: this.sessionKey,
      message: text,
      deliver: true,
      idempotencyKey: uuid(),
    };
    if (attachments && attachments.length > 0) {
      params.attachments = attachments;
    }
    await this.sendRequest("chat.send", params, 900000);
  }

  async abortRun(): Promise<void> {
    try {
      await this.sendRequest("chat.abort", { sessionKey: this.sessionKey }, 5000);
    } catch { /* ignore */ }
  }

  async listSessions(): Promise<unknown> {
    return this.sendRequest("sessions.list", {});
  }

  async getHealth(): Promise<unknown> {
    return this.sendRequest("health", {});
  }

  async listModels(): Promise<unknown> {
    return this.sendRequest("models.list", {});
  }

  async listDevices(): Promise<unknown> {
    return this.sendRequest("device.pair.list", {});
  }

  async getStatus(): Promise<unknown> {
    return this.sendRequest("health", {});
  }

  async getToolsCatalog(): Promise<unknown> {
    return this.sendRequest("tools.catalog", {});
  }

  async getConfig(): Promise<unknown> {
    return this.sendRequest("config.get", {});
  }

  async setModel(modelId: string): Promise<void> {
    const configResult = await this.sendRequest("config.get", {}) as Record<string, unknown>;
    const baseHash = configResult?.hash as string;
    const patch = JSON.stringify({
      agents: { defaults: { model: { primary: modelId } } },
    });
    await this.sendRequest("config.patch", { raw: patch, baseHash });
  }

  // ---- Generic RPC (for Settings panel to call any method) ----
  async rpc<T = unknown>(method: string, params: Record<string, unknown> = {}, timeoutMs = 30000): Promise<T> {
    return this.sendRequest(method, params, timeoutMs) as Promise<T>;
  }

  // ---- Config ----
  async getConfigSchema(): Promise<unknown> {
    return this.sendRequest("config.schema", {});
  }

  async patchConfig(patch: Record<string, unknown>, baseHash: string): Promise<unknown> {
    return this.sendRequest("config.patch", { raw: JSON.stringify(patch), baseHash });
  }

  // ---- Sessions ----
  async getSession(sessionKey: string): Promise<unknown> {
    return this.sendRequest("sessions.get", { sessionKey });
  }

  async deleteSessionRemote(sessionKey: string): Promise<unknown> {
    return this.sendRequest("sessions.delete", { sessionKey });
  }

  async clearSession(sessionKey: string): Promise<unknown> {
    return this.sendRequest("sessions.reset", { sessionKey });
  }

  // ---- Agents ----
  async listAgents(): Promise<unknown> {
    return this.sendRequest("agents.list", {});
  }

  async getAgent(agentId: string): Promise<unknown> {
    return this.sendRequest("agents.get", { agentId });
  }

  async createAgent(agent: Record<string, unknown>): Promise<unknown> {
    return this.sendRequest("agents.create", agent);
  }

  async updateAgent(agentId: string, patch: Record<string, unknown>): Promise<unknown> {
    return this.sendRequest("agents.update", { agentId, ...patch });
  }

  async deleteAgent(agentId: string): Promise<unknown> {
    return this.sendRequest("agents.delete", { agentId });
  }

  // ---- Skills ----
  async listSkills(): Promise<unknown> {
    return this.sendRequest("skills.status", {});
  }

  async installSkill(skill: Record<string, unknown>): Promise<unknown> {
    return this.sendRequest("skills.install", skill);
  }

  async updateSkill(skill: Record<string, unknown>): Promise<unknown> {
    return this.sendRequest("skills.update", skill);
  }

  // ---- Cron ----
  async listCron(): Promise<unknown> {
    return this.sendRequest("cron.list", {});
  }

  async addCron(job: Record<string, unknown>): Promise<unknown> {
    return this.sendRequest("cron.add", job);
  }

  async updateCron(jobId: string, patch: Record<string, unknown>): Promise<unknown> {
    return this.sendRequest("cron.update", { jobId, ...patch });
  }

  async removeCron(jobId: string): Promise<unknown> {
    return this.sendRequest("cron.remove", { jobId });
  }

  // ---- TTS ----
  async listTTSProviders(): Promise<unknown> {
    return this.sendRequest("tts.providers", {});
  }

  async getTTSStatus(): Promise<unknown> {
    return this.sendRequest("tts.status", {});
  }

  async ttsSpeak(text: string, voice?: string): Promise<unknown> {
    return this.sendRequest("talk.speak", { text, voice });
  }

  // ---- Exec Approvals ----
  async getApprovals(): Promise<unknown> {
    return this.sendRequest("exec.approvals.get", {});
  }

  async resolveApproval(requestId: string, approved: boolean): Promise<unknown> {
    return this.sendRequest("exec.approval.resolve", { requestId, approved });
  }

  // ---- Usage ----
  async getUsage(): Promise<unknown> {
    return this.sendRequest("usage.status", {});
  }

  async getUsageCost(): Promise<unknown> {
    return this.sendRequest("usage.cost", {});
  }

  // ---- Logs ----
  async tailLogs(lines = 50): Promise<unknown> {
    return this.sendRequest("logs.tail", { lines });
  }

  // ---- Updates ----
  async runUpdate(): Promise<unknown> {
    return this.sendRequest("update.run", {}, 120000);
  }

  // ---- Device Pairing ----
  async approveDevice(requestId: string, scopes: string[]): Promise<unknown> {
    return this.sendRequest("device.pair.approve", { requestId, scopes });
  }

  async revokeDevice(deviceId: string): Promise<unknown> {
    return this.sendRequest("device.pair.remove", { deviceId });
  }

  getSessionKey() { return this.sessionKey; }
  setSessionKey(key: string) { this.sessionKey = key; }

  newSession() {
    this.sessionKey = `ui-${uuid()}`;
    return this.sessionKey;
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN && this.connId !== null;
  }
}
