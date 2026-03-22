import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { MemorySearchResult } from "../../memory/types.js";
import { __testing } from "./chat-memory.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map(async (dir) => {
      await fs.rm(dir, { recursive: true, force: true });
    }),
  );
});

describe("chat memory recall", () => {
  it("keeps only the elite memory chunks", () => {
    const results: MemorySearchResult[] = [
      {
        path: "memory/2026-03-21.md",
        startLine: 1,
        endLine: 2,
        score: 0.91,
        snippet: "ThinkPad T14 uses SSD SK Hynix and 16GB RAM.",
        source: "memory",
      },
      {
        path: "memory/2026-02-01.md",
        startLine: 1,
        endLine: 2,
        score: 0.44,
        snippet: "Completely unrelated grocery list.",
        source: "memory",
      },
      {
        path: "MEMORY.md",
        startLine: 10,
        endLine: 10,
        score: 0.82,
        snippet: "Project LomboClaw talks to the OpenClaw gateway over websocket chat.send.",
        source: "memory",
      },
      {
        path: "memory/2026-03-20.md",
        startLine: 5,
        endLine: 5,
        score: 0.88,
        snippet: "Hardware note: 24GB RTX 3090 and ThinkPad context.",
        source: "memory",
      },
    ];

    const selected = __testing.critiqueMemoryResults(
      "lembra qual SSD do ThinkPad e como o projeto LomboClaw conversa com o gateway?",
      results,
    );

    expect(selected).toHaveLength(3);
    expect(selected.some((entry) => entry.snippet.includes("grocery"))).toBe(false);
  });
});

describe("chat live memory capture", () => {
  it("normalizes and deduplicates recent facts in MEMORY.md", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-chat-memory-"));
    tempDirs.push(tempDir);
    const memoryFilePath = path.join(tempDir, "MEMORY.md");

    const formatted = `[HARDWARE] ${__testing.cleanFactText(
      "anota ai que o ThinkPad T14 usa SSD SK Hynix e 16GB RAM",
    )}`;
    const first = await __testing.upsertRecentMemory({
      memoryFilePath,
      formattedFact: formatted,
    });
    const second = await __testing.upsertRecentMemory({
      memoryFilePath,
      formattedFact: formatted,
    });

    const content = await fs.readFile(memoryFilePath, "utf-8");
    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(content).toContain("## Últimas Atualizações");
    expect(content.match(/ThinkPad T14 usa SSD SK Hynix e 16GB RAM\./g)?.length).toBe(1);
  });
});
