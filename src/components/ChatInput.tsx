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
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
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
    <div className="w-full px-6 pb-8 pt-5">
      <div className="mx-auto max-w-[960px]">
        {attachments.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-3 px-1">
            {attachments.map((att, i) => (
              <div key={i} className="group/att relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1.5 backdrop-blur-sm transition-all duration-200 hover:border-white/[0.1] hover:bg-white/[0.04]">
                <img src={att.preview} alt={att.name} className="h-18 w-18 rounded-xl object-cover" />
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/80 text-white opacity-0 transition-all duration-200 hover:bg-red-500 group-hover/att:opacity-100 backdrop-blur-sm"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div
          className={`rounded-[28px] border backdrop-blur-sm px-7 py-6 transition-all duration-300 ${
            dragOver 
              ? "border-emerald-500/40 bg-emerald-500/5 shadow-[0_0_40px_rgba(16,185,129,0.15)]" 
              : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.03] focus-within:border-white/[0.1] focus-within:bg-white/[0.03] shadow-[0_8px_40px_rgba(0,0,0,0.3)]"
          }`}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
        >
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={isConnected ? "Como posso ajudar?" : "Desconectado..."}
            disabled={!isConnected}
            rows={1}
            className="max-h-[200px] min-h-[48px] w-full resize-none bg-transparent p-0 text-[16px] leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-500/70 disabled:opacity-40 transition-opacity"
          />

          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1">
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
                className="rounded-xl p-2.5 text-zinc-500 transition-all duration-200 hover:bg-white/[0.06] hover:text-zinc-200 disabled:opacity-30 active:scale-95"
                title="Anexar imagem"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
              <button
                type="button"
                disabled
                className="rounded-xl p-2.5 text-zinc-600 opacity-50"
                title="Ferramentas extras em breve"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled
                className="rounded-xl p-2.5 text-zinc-600 opacity-50"
                title="Microfone em breve"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 15a3 3 0 003-3V7a3 3 0 10-6 0v5a3 3 0 003 3Z" />
                  <path d="M19 11a7 7 0 01-14 0M12 18v3" />
                </svg>
              </button>

              {isStreaming ? (
                <button
                  onClick={onAbort}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-700 text-zinc-200 transition-all duration-200 hover:bg-zinc-600 hover:scale-105 active:scale-95 shadow-lg"
                  title="Parar"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={(!inputValue.trim() && attachments.length === 0) || !isConnected}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 text-black transition-all duration-200 hover:from-emerald-300 hover:to-emerald-400 hover:scale-105 active:scale-95 disabled:opacity-20 disabled:hover:scale-100 shadow-lg shadow-emerald-500/25"
                  title="Enviar"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
