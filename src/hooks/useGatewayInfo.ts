"use client";

import { useEffect, useState, useCallback } from "react";
import { OpenClawClient } from "@/lib/openclaw-client";
import { useAppStore } from "@/lib/store";

export interface GatewayModel {
  id: string;
  name: string;
  provider: string;
  reasoning?: boolean;
}

export interface GatewayDevice {
  deviceId: string;
  clientId: string;
  platform: string;
  role: string;
  scopes: string[];
}

export interface GatewayInfo {
  health: {
    status: string;
    uptimeMs: number;
    version: string;
  } | null;
  models: GatewayModel[];
  devices: GatewayDevice[];
  activeModel: string | null;
  loading: boolean;
}

export function useGatewayInfo(clientRef: React.RefObject<OpenClawClient | null>) {
  const connectionState = useAppStore((s) => s.connectionState);
  const [info, setInfo] = useState<GatewayInfo>({
    health: null,
    models: [],
    devices: [],
    activeModel: null,
    loading: false,
  });

  const fetchInfo = useCallback(async () => {
    const client = clientRef.current;
    if (!client || !client.isConnected()) return;

    setInfo((prev) => ({ ...prev, loading: true }));

    try {
      const [health, models, devices, config] = await Promise.allSettled([
        client.getHealth(),
        client.listModels(),
        client.listDevices(),
        client.getConfig(),
      ]);

      const catalogModels = models.status === "fulfilled" ? parseModels(models.value) : [];
      const configModels = config.status === "fulfilled" ? parseConfigModels(config.value) : [];

      // Merge: catalog first, then config models not already in catalog
      const catalogIds = new Set(catalogModels.map((m) => m.id));
      const merged = [
        ...catalogModels,
        ...configModels.filter((m) => !catalogIds.has(m.id)),
      ];

      setInfo({
        health: health.status === "fulfilled" ? parseHealth(health.value) : null,
        models: merged,
        devices: devices.status === "fulfilled" ? parseDevices(devices.value) : [],
        activeModel: null,
        loading: false,
      });
    } catch {
      setInfo((prev) => ({ ...prev, loading: false }));
    }
  }, [clientRef]);

  // Fetch on connect
  useEffect(() => {
    if (connectionState === "connected") {
      // Small delay to ensure connection is stable
      const timer = setTimeout(fetchInfo, 1500);
      return () => clearTimeout(timer);
    }
  }, [connectionState, fetchInfo]);

  return { ...info, refresh: fetchInfo };
}

function parseHealth(raw: unknown): GatewayInfo["health"] {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  return {
    status: (r.status as string) || "unknown",
    uptimeMs: (r.uptimeMs as number) || 0,
    version: (r.version as string) || "?",
  };
}

function parseModels(raw: unknown): GatewayModel[] {
  if (!raw || typeof raw !== "object") return [];
  const r = raw as Record<string, unknown>;
  const models = r.models as unknown[];
  if (!Array.isArray(models)) return [];

  return models.map((m) => {
    const model = m as Record<string, unknown>;
    const rawId = (model.id as string) || "";
    const provider = (model.provider as string) || "";
    // Compose full ID as provider/model for config compatibility
    const id = provider && !rawId.includes("/") ? `${provider}/${rawId}` : rawId;
    return {
      id,
      name: (model.name as string) || rawId,
      provider,
      reasoning: model.reasoning as boolean,
    };
  });
}

function parseConfigModels(raw: unknown): GatewayModel[] {
  if (!raw || typeof raw !== "object") return [];
  const r = raw as Record<string, unknown>;
  const config = r.config as Record<string, unknown> | undefined;
  if (!config) return [];
  const models = config.models as Record<string, unknown> | undefined;
  if (!models) return [];
  const providers = models.providers as Record<string, unknown> | undefined;
  if (!providers) return [];

  const result: GatewayModel[] = [];
  for (const [providerKey, providerVal] of Object.entries(providers)) {
    if (!providerVal || typeof providerVal !== "object") continue;
    const p = providerVal as Record<string, unknown>;
    const modelList = p.models as unknown[];
    if (!Array.isArray(modelList)) continue;
    for (const m of modelList) {
      const model = m as Record<string, unknown>;
      const id = model.id as string;
      if (!id) continue;
      result.push({
        id: `${providerKey}/${id}`,
        name: (model.name as string) || id,
        provider: providerKey,
        reasoning: model.reasoning as boolean,
      });
    }
  }
  return result;
}

function parseDevices(raw: unknown): GatewayDevice[] {
  if (!raw || typeof raw !== "object") return [];
  const r = raw as Record<string, unknown>;
  const paired = r.paired as unknown[];
  if (!Array.isArray(paired)) return [];

  return paired.map((d) => {
    const dev = d as Record<string, unknown>;
    return {
      deviceId: ((dev.deviceId as string) || "").slice(0, 12) + "...",
      clientId: (dev.clientId as string) || "",
      platform: (dev.platform as string) || "",
      role: (dev.role as string) || "",
      scopes: (dev.scopes as string[]) || [],
    };
  });
}
