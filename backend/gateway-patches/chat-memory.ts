import fs from "node:fs/promises";
import path from "node:path";
import type { OpenClawConfig } from "../../config/config.js";
import { resolveAgentWorkspaceDir } from "../../agents/agent-scope.js";
import { resolveMemorySearchConfig } from "../../agents/memory-search.js";
import { getMemorySearchManager } from "../../memory/index.js";
import type { MemorySearchResult } from "../../memory/types.js";
import { createSubsystemLogger } from "../../logging/subsystem.js";
import { resolveSessionAgentId } from "../../agents/agent-scope.js";

const log = createSubsystemLogger("gateway/chat-memory");

const MEMORY_CUE_PATTERNS = [
  /\blembra\b/i,
  /\blembre\b/i,
  /\bremember\b/i,
  /\bantes\b/i,
  /\bpassado\b/i,
  /\banota\b/i,
  /\bguarda\b/i,
  /\bnao esquece\b/i,
  /\bnão esquece\b/i,
  /\bhardware\b/i,
  /\bssd\b/i,
  /\bram\b/i,
  /\bvram\b/i,
  /\bthinkpad\b/i,
  /\bprojeto\b/i,
  /\bconfig\b/i,
  /\bconfiguracao\b/i,
  /\bconfiguração\b/i,
];

const IMPORTANT_FACT_PATTERNS = [
  /\blembre-se\b/i,
  /\blembra disso\b/i,
  /\banota ai\b/i,
  /\banota aí\b/i,
  /\bguarda isso\b/i,
  /\bnao esquece\b/i,
  /\bnão esquece\b/i,
];

type ChatMemoryRecall = {
  injectedPrompt?: string;
  results: MemorySearchResult[];
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length >= 3);
}

function shouldRecallMemory(message: string): boolean {
  if (!message.trim()) {
    return false;
  }
  return MEMORY_CUE_PATTERNS.some((pattern) => pattern.test(message));
}

function scoreOverlap(query: string, snippet: string): number {
  const queryTokens = new Set(tokenize(query));
  if (queryTokens.size === 0) {
    return 0;
  }
  let hits = 0;
  for (const token of tokenize(snippet)) {
    if (queryTokens.has(token)) {
      hits += 1;
    }
  }
  return hits / queryTokens.size;
}

function critiqueMemoryResults(message: string, results: MemorySearchResult[]): MemorySearchResult[] {
  return results
    .map((entry) => ({
      entry,
      overlap: scoreOverlap(message, entry.snippet),
    }))
    .filter(({ overlap, entry }) => overlap > 0 || entry.score >= 0.55)
    .sort((left, right) => {
      if (right.overlap !== left.overlap) {
        return right.overlap - left.overlap;
      }
      return right.entry.score - left.entry.score;
    })
    .slice(0, 3)
    .map(({ entry }) => entry);
}

function formatMemorySnippet(entry: MemorySearchResult): string {
  const location =
    entry.startLine === entry.endLine
      ? `${entry.path}#L${entry.startLine}`
      : `${entry.path}#L${entry.startLine}-L${entry.endLine}`;
  const snippet = entry.snippet.replace(/\s+/g, " ").trim();
  return `- ${location}: ${snippet}`;
}

function buildMemoryPrompt(results: MemorySearchResult[]): string | undefined {
  if (results.length === 0) {
    return undefined;
  }
  return [
    "[Memory Recall]",
    "Use only the relevant memory below. Ignore stale or unrelated items. Do not restate these notes unless they help answer the user.",
    ...results.map(formatMemorySnippet),
  ].join("\n");
}

export async function loadChatMemoryRecall(params: {
  cfg: OpenClawConfig;
  sessionKey: string;
  message: string;
}): Promise<ChatMemoryRecall> {
  if (!shouldRecallMemory(params.message)) {
    return { results: [] };
  }
  const agentId = resolveSessionAgentId({
    sessionKey: params.sessionKey,
    config: params.cfg,
  });
  if (!resolveMemorySearchConfig(params.cfg, agentId)) {
    return { results: [] };
  }
  const memory = await getMemorySearchManager({
    cfg: params.cfg,
    agentId,
  });
  if (!memory.manager) {
    log.warn(`memory recall unavailable: ${memory.error ?? "unknown error"}`);
    return { results: [] };
  }
  try {
    const results = await memory.manager.search(params.message, {
      maxResults: 6,
      sessionKey: params.sessionKey,
    });
    const selected = critiqueMemoryResults(params.message, results);
    return {
      injectedPrompt: buildMemoryPrompt(selected),
      results: selected,
    };
  } catch (err) {
    log.warn(`memory recall failed: ${err instanceof Error ? err.message : String(err)}`);
    return { results: [] };
  }
}

function shouldCaptureImportantFact(message: string): boolean {
  if (!message.trim()) {
    return false;
  }
  if (IMPORTANT_FACT_PATTERNS.some((pattern) => pattern.test(message))) {
    return true;
  }
  return /\b(ssd|ram|vram|gpu|cpu|thinkpad|projeto|config|configuracao|configuração)\b/i.test(
    message,
  );
}

function classifyFactLabel(message: string): string {
  if (/\b(ssd|ram|vram|gpu|cpu|thinkpad)\b/i.test(message)) {
    return "HARDWARE";
  }
  if (/\bconfig|configuracao|configuração\b/i.test(message)) {
    return "CONFIG";
  }
  if (/\bprojeto|repo|workspace\b/i.test(message)) {
    return "PROJECT";
  }
  if (/\bprefiro|preferencia|preferência\b/i.test(message)) {
    return "PREFERENCE";
  }
  return "NOTE";
}

function cleanFactText(message: string): string {
  const cleaned = message
    .replace(/^\s*(lembre-se|lembra disso|anota ai|anota aí|guarda isso|nao esquece|não esquece)\s*(que)?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) {
    return "";
  }
  const normalizedStart = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return /[.!?]$/.test(normalizedStart) ? normalizedStart : `${normalizedStart}.`;
}

function similarity(left: string, right: string): number {
  const a = new Set(tokenize(left));
  const b = new Set(tokenize(right));
  if (a.size === 0 || b.size === 0) {
    return 0;
  }
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) {
      intersection += 1;
    }
  }
  return intersection / Math.max(a.size, b.size);
}

async function upsertRecentMemory(params: {
  memoryFilePath: string;
  formattedFact: string;
}): Promise<boolean> {
  const sectionTitle = "## Últimas Atualizações";
  let content = "";
  try {
    content = await fs.readFile(params.memoryFilePath, "utf-8");
  } catch {
    content = "# MEMORY\n\n";
  }

  const lines = content.split(/\r?\n/);
  const existingFact = lines.find(
    (line) => line.trim().startsWith("- ") && similarity(line, params.formattedFact) >= 0.9,
  );
  if (existingFact) {
    return false;
  }

  const sectionIndex = lines.findIndex((line) => line.trim() === sectionTitle);
  if (sectionIndex === -1) {
    const nextContent = `${content.trimEnd()}\n\n${sectionTitle}\n\n- ${params.formattedFact}\n`;
    await fs.writeFile(params.memoryFilePath, nextContent, "utf-8");
    return true;
  }

  const insertionIndex = sectionIndex + 1;
  const nextLines = [...lines];
  while (nextLines[insertionIndex] === "") {
    nextLines.splice(insertionIndex, 1);
  }
  nextLines.splice(insertionIndex, 0, "", `- ${params.formattedFact}`);
  await fs.writeFile(params.memoryFilePath, `${nextLines.join("\n").replace(/\n+$/, "\n")}`, "utf-8");
  return true;
}

export async function captureLiveMemory(params: {
  cfg: OpenClawConfig;
  sessionKey: string;
  message: string;
}): Promise<boolean> {
  if (!shouldCaptureImportantFact(params.message)) {
    return false;
  }
  const factText = cleanFactText(params.message);
  if (!factText) {
    return false;
  }
  const agentId = resolveSessionAgentId({
    sessionKey: params.sessionKey,
    config: params.cfg,
  });
  const workspaceDir = resolveAgentWorkspaceDir(params.cfg, agentId);
  if (!workspaceDir) {
    return false;
  }
  const formattedFact = `[${classifyFactLabel(params.message)}] ${factText}`;
  const memoryFilePath = path.join(workspaceDir, "MEMORY.md");
  const updated = await upsertRecentMemory({
    memoryFilePath,
    formattedFact,
  });
  if (!updated) {
    return false;
  }

  const memory = await getMemorySearchManager({
    cfg: params.cfg,
    agentId,
  });
  try {
    await memory.manager?.sync?.({
      reason: "live-memory",
      force: false,
    });
  } catch (err) {
    log.warn(`live memory sync failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  return true;
}

export const __testing = {
  shouldRecallMemory,
  critiqueMemoryResults,
  cleanFactText,
  classifyFactLabel,
  similarity,
  upsertRecentMemory,
};
