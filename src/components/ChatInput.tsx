"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/lib/store";

export interface Attachment {
  type: string;
  mimeType: string;
  content: string;
  preview: string;
  name: string;
}

interface ChatInputProps {
  onSend: (text: string, attachments?: Attachment[]) => void;
  onAbort: () => void;
}

const ACCEPTED_TYPES = "image/png,image/jpeg,image/gif,image/webp";
const MAX_FILE_SIZE = 20 * 1024 * 1024;

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
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_FILE_SIZE) continue;
      try {
        const base64 = await fileToBase64(file);
        const preview = URL.createObjectURL(file);
        setAttachments((prev) => [
          ...prev,
          { type: "image", mimeType: file.type, content: base64, preview, name: file.name },
        ]);
      } catch (e) {
        console.error("[ChatInput] Failed to read file:", e);
      }
    }
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleSubmit = () => {
    const text = inputValue.trim();
    if ((!text && attachments.length === 0) || !isConnected) return;
    onSend(text || "(imagem)", attachments.length > 0 ? attachments : undefined);
    attachments.forEach((a) => URL.revokeObjectURL(a.preview));
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
      const imageFiles: File[] = [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        handleFiles(imageFiles);
      }
    },
    [handleFiles]
  );

  return (
    <div className="w-full px-3 pb-3 pt-2">
      <div className="mx-auto max-w-[720px]">
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {attachments.map((att, i) => (
              <div key={i} className="group/att relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
                <img src={att.preview} alt={att.name} className="h-12 w-12 rounded object-cover" />
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition group-hover/att:opacity-100"
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
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
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files);
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
        >
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
                title="Anexar imagem"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
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
