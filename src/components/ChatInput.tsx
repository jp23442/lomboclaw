"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/lib/store";

export interface Attachment {
  type: string;
  mimeType: string;
  content: string;
  preview: string;
  name: string;
  size: number;
}

interface ChatInputProps {
  onSend: (text: string, attachments?: Attachment[]) => void;
  onAbort: () => void;
}

// Expanded file type support
const ACCEPTED_TYPES = [
  "image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml",
  "application/pdf",
  "text/plain", "text/csv", "text/markdown", "text/html", "text/css",
  "application/json", "application/xml",
  "application/javascript", "text/javascript", "text/typescript",
  "application/x-python", "text/x-python",
].join(",");

const MAX_FILE_SIZE = 20 * 1024 * 1024;

function getFileType(mimeType: string, name: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  const codeExts = [".py", ".js", ".ts", ".tsx", ".jsx", ".rs", ".go", ".java", ".c", ".cpp", ".h", ".cs", ".rb", ".php", ".sh", ".bash", ".zsh", ".sql", ".yaml", ".yml", ".toml"];
  if (codeExts.some((ext) => name.toLowerCase().endsWith(ext))) return "code";
  if (mimeType.startsWith("text/") || mimeType.includes("json") || mimeType.includes("xml") || mimeType.includes("javascript")) return "text";
  return "file";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

const FILE_ICONS: Record<string, string> = {
  pdf: "PDF",
  code: "</>",
  text: "TXT",
  file: "FILE",
};

export function ChatInput({ onSend, onAbort }: ChatInputProps) {
  const { inputValue, setInputValue, streaming, connectionState } = useAppStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const isStreaming = streaming !== null;
  const isConnected = connectionState === "connected";

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 150) + "px";
  }, [inputValue]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      if (file.size > MAX_FILE_SIZE) {
        console.warn(`[ChatInput] File too large: ${file.name} (${formatSize(file.size)})`);
        continue;
      }
      try {
        const fileType = getFileType(file.type, file.name);
        let content: string;
        let preview: string;

        if (fileType === "image") {
          content = await fileToBase64(file);
          preview = URL.createObjectURL(file);
        } else {
          // Text-based files: read as text, send as base64
          const textContent = await fileToText(file);
          content = btoa(unescape(encodeURIComponent(textContent)));
          // Preview: first 3 lines
          preview = textContent.split("\n").slice(0, 3).join("\n");
          if (textContent.split("\n").length > 3) preview += "\n...";
        }

        console.log(`[OpenClaw] Attachment: ${file.name} (${formatSize(file.size)}, ${fileType})`);

        setAttachments((prev) => [
          ...prev,
          { type: fileType, mimeType: file.type || "application/octet-stream", content, preview, name: file.name, size: file.size },
        ]);
      } catch (e) {
        console.error("[ChatInput] Failed to read file:", e);
      }
    }
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => {
      const removed = prev[index];
      if (removed && removed.type === "image") URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleSubmit = () => {
    const text = inputValue.trim();
    if ((!text && attachments.length === 0) || !isConnected) return;
    onSend(text || "(anexo)", attachments.length > 0 ? attachments : undefined);
    attachments.forEach((a) => { if (a.type === "image") URL.revokeObjectURL(a.preview); });
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isStreaming) return;
      handleSubmit();
    }
  };

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        handleFiles(files);
      }
    },
    [handleFiles]
  );

  // Allow dropping any file
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div className="w-full px-3 pb-3 pt-2">
      <div className="mx-auto max-w-[720px]">
        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {attachments.map((att, i) => (
              <div key={i} className="group/att relative flex items-center gap-2 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 pr-2">
                {att.type === "image" ? (
                  <img src={att.preview} alt={att.name} className="h-12 w-12 rounded-l object-cover" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-l bg-zinc-800">
                    <span className="font-mono text-[9px] font-bold text-zinc-400">
                      {FILE_ICONS[att.type] || "FILE"}
                    </span>
                  </div>
                )}
                <div className="min-w-0 py-1">
                  <div className="truncate text-[11px] font-medium text-zinc-300 max-w-[120px]">{att.name}</div>
                  <div className="text-[9px] text-zinc-500">{formatSize(att.size)}</div>
                </div>
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition group-hover/att:opacity-100"
                >
                  <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div
          className={`rounded-xl border px-3 py-2.5 transition ${
            dragOver
              ? "border-emerald-500/40 bg-emerald-950/10"
              : "border-zinc-800 bg-zinc-900/60 focus-within:border-zinc-700"
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
        >
          {/* Drag overlay */}
          {dragOver && (
            <div className="mb-2 flex items-center justify-center rounded-lg border border-dashed border-emerald-500/40 bg-emerald-950/10 py-3">
              <span className="text-[12px] text-emerald-400">Solte o arquivo aqui</span>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={isConnected ? "Mensagem para LomboClaw..." : "Desconectado..."}
            disabled={!isConnected}
            rows={1}
            className="max-h-[150px] min-h-[32px] w-full resize-none bg-transparent p-0 text-[13px] leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-500 disabled:opacity-40"
          />

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-0.5">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!isConnected}
                className="rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-30"
                title="Anexar arquivo (imagem, código, texto, PDF...)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                </svg>
              </button>
              {attachments.length > 0 && (
                <span className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400">
                  {attachments.length} {attachments.length === 1 ? "arquivo" : "arquivos"}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {isStreaming ? (
                <button
                  onClick={onAbort}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-700 text-zinc-200 transition hover:bg-zinc-600"
                  title="Parar"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={(!inputValue.trim() && attachments.length === 0) || !isConnected}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-200 text-zinc-900 transition hover:bg-white disabled:opacity-20"
                  title="Enviar"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-1.5 text-center text-[10px] text-zinc-600">
          LomboClaw pode cometer erros. Verifique informações importantes.
        </div>
      </div>
    </div>
  );
}
