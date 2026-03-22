"use client";

import { useState } from "react";
import { ToolCall } from "@/lib/openclaw-client";

interface ToolCallRendererProps {
  tool: ToolCall;
}

// Detect tool category from name
function getToolCategory(name: string): "file-read" | "file-edit" | "file-write" | "bash" | "search" | "web" | "other" {
  const n = name.toLowerCase();
  if (n === "read" || n.includes("file_read") || n.includes("readfile")) return "file-read";
  if (n === "edit" || n.includes("file_edit") || n.includes("editfile") || n.includes("replace")) return "file-edit";
  if (n === "write" || n.includes("file_write") || n.includes("writefile") || n.includes("createfile")) return "file-write";
  if (n === "bash" || n.includes("execute") || n.includes("command") || n.includes("shell") || n.includes("terminal")) return "bash";
  if (n === "glob" || n === "grep" || n.includes("search_file") || n.includes("find")) return "search";
  if (n.includes("web") || n.includes("fetch") || n.includes("browse")) return "web";
  return "other";
}

function getFileName(input: Record<string, unknown>): string {
  const path = (input.file_path || input.path || input.filePath || input.file || "") as string;
  if (!path) return "";
  // Get just the filename from path
  const parts = path.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] || path;
}

function getFullPath(input: Record<string, unknown>): string {
  return ((input.file_path || input.path || input.filePath || input.file || "") as string).replace(/\\/g, "/");
}

function StatusIcon({ state }: { state?: string }) {
  if (state === "done") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" className="shrink-0">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    );
  }
  if (state === "error") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" className="shrink-0">
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    );
  }
  return <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0" />;
}

function ToolIcon({ category }: { category: string }) {
  switch (category) {
    case "file-read":
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
      );
    case "file-edit":
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      );
    case "file-write":
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6M12 18v-6M9 15h6" />
        </svg>
      );
    case "bash":
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
          <path d="M4 17l6-6-6-6M12 19h8" />
        </svg>
      );
    case "search":
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      );
    case "web":
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
      );
    default:
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
        </svg>
      );
  }
}

// --- Diff renderer ---
function DiffView({ oldStr, newStr }: { oldStr: string; newStr: string }) {
  const oldLines = oldStr.split("\n");
  const newLines = newStr.split("\n");

  return (
    <div className="font-mono text-xs leading-relaxed overflow-x-auto">
      {oldLines.length > 0 && oldStr && (
        <div className="mb-1">
          {oldLines.map((line, i) => (
            <div key={`old-${i}`} className="flex">
              <span className="select-none w-5 text-right text-red-400/50 mr-2 shrink-0">-</span>
              <span className="text-red-400/80 bg-red-950/30 flex-1 px-1 rounded-sm">{line || " "}</span>
            </div>
          ))}
        </div>
      )}
      {newLines.length > 0 && newStr && (
        <div>
          {newLines.map((line, i) => (
            <div key={`new-${i}`} className="flex">
              <span className="select-none w-5 text-right text-green-400/50 mr-2 shrink-0">+</span>
              <span className="text-green-400/80 bg-green-950/30 flex-1 px-1 rounded-sm">{line || " "}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Bash output renderer ---
function BashView({ command, output, description }: { command?: string; output?: string; description?: string }) {
  return (
    <div className="font-mono text-xs">
      {description && (
        <div className="text-zinc-500 mb-1 text-[10px]">{description}</div>
      )}
      {command && (
        <div className="flex items-start gap-1.5 mb-1">
          <span className="text-emerald-500 select-none">$</span>
          <span className="text-zinc-300">{command}</span>
        </div>
      )}
      {output && (
        <pre className="text-zinc-500 whitespace-pre-wrap max-h-48 overflow-y-auto mt-1">{output}</pre>
      )}
    </div>
  );
}

function ExpandedContent({ tool, category }: { tool: ToolCall; category: string }) {
  switch (category) {
    case "file-edit":
      return (
        <DiffView
          oldStr={(tool.input.old_string as string) || ""}
          newStr={(tool.input.new_string as string) || ""}
        />
      );
    case "bash":
      return (
        <BashView
          command={tool.input.command as string}
          output={tool.output}
          description={tool.input.description as string}
        />
      );
    case "file-write":
      return tool.input.content ? (
        <div className="font-mono text-xs">
          <pre className="text-green-400/80 whitespace-pre-wrap max-h-64 overflow-y-auto">
            {(tool.input.content as string).slice(0, 2000)}
            {(tool.input.content as string).length > 2000 && "\n... (truncated)"}
          </pre>
        </div>
      ) : null;
    case "file-read":
      return tool.output ? (
        <div className="font-mono text-xs">
          <pre className="text-zinc-400 whitespace-pre-wrap max-h-48 overflow-y-auto">
            {tool.output.slice(0, 2000)}
            {tool.output.length > 2000 && "\n... (truncated)"}
          </pre>
        </div>
      ) : null;
    case "search":
      return tool.output ? (
        <div className="font-mono text-xs">
          <pre className="text-zinc-400 whitespace-pre-wrap max-h-48 overflow-y-auto">{tool.output}</pre>
        </div>
      ) : null;
    case "web":
      return tool.output ? (
        <div className="font-mono text-xs">
          <pre className="text-zinc-400 whitespace-pre-wrap max-h-48 overflow-y-auto">
            {tool.output.slice(0, 2000)}
            {tool.output.length > 2000 && "\n... (truncated)"}
          </pre>
        </div>
      ) : null;
    default:
      return (
        <div className="font-mono text-xs space-y-2">
          {Object.keys(tool.input).length > 0 && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-600">Input</span>
              <pre className="text-zinc-500 whitespace-pre-wrap mt-1 max-h-32 overflow-y-auto">
                {JSON.stringify(tool.input, null, 2)}
              </pre>
            </div>
          )}
          {tool.output && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-600">Output</span>
              <pre className="text-zinc-500 whitespace-pre-wrap mt-1 max-h-32 overflow-y-auto">
                {tool.output.slice(0, 2000)}
              </pre>
            </div>
          )}
        </div>
      );
  }
}

// --- Main renderer ---
export function ToolCallRenderer({ tool }: ToolCallRendererProps) {
  const [expanded, setExpanded] = useState(false);
  const category = getToolCategory(tool.name);
  const fileName = getFileName(tool.input);
  const fullPath = getFullPath(tool.input);

  // Build summary label
  let summary = tool.name;
  if (category === "file-read" && fileName) summary = `Lendo ${fileName}`;
  else if (category === "file-edit" && fileName) summary = `Editando ${fileName}`;
  else if (category === "file-write" && fileName) summary = `Criando ${fileName}`;
  else if (category === "bash") {
    const cmd = (tool.input.command as string) || "";
    const short = cmd.length > 60 ? cmd.slice(0, 57) + "..." : cmd;
    summary = short || "Executando comando";
  }
  else if (category === "search") {
    const pattern = (tool.input.pattern as string) || (tool.input.query as string) || "";
    summary = `Buscando "${pattern}"`;
  }
  else if (category === "web") {
    const url = (tool.input.url as string) || "";
    summary = url ? `Acessando ${url.slice(0, 50)}` : "Web request";
  }

  const hasContent = !!(
    (category === "file-edit" && (tool.input.old_string || tool.input.new_string)) ||
    (category === "bash" && (tool.input.command || tool.output)) ||
    (category === "file-write" && tool.input.content) ||
    (category === "file-read" && tool.output) ||
    (category === "search" && tool.output) ||
    tool.output
  );

  return (
    <div className="border border-zinc-800/80 rounded-lg overflow-hidden bg-zinc-900/30">
      {/* Header */}
      <button
        onClick={() => hasContent && setExpanded(!expanded)}
        className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
          hasContent ? "hover:bg-zinc-800/50 cursor-pointer" : "cursor-default"
        }`}
      >
        <StatusIcon state={tool.state} />
        <ToolIcon category={category} />
        <span className="text-zinc-300 truncate flex-1 text-left">{summary}</span>

        {fullPath && category !== "bash" && (
          <span className="text-[10px] text-zinc-600 font-mono truncate max-w-[200px] hidden md:block">
            {fullPath}
          </span>
        )}

        {hasContent && (
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`text-zinc-600 transition-transform shrink-0 ${expanded ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        )}
      </button>

      {expanded && (
        <div className="border-t border-zinc-800/80 px-3 py-2.5 bg-zinc-950/50 tool-expand">
          <ExpandedContent tool={tool} category={category} />
        </div>
      )}
    </div>
  );
}
