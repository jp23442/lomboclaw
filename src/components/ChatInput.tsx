"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/lib/store";

export interface Attachment {
  type: string;
  mimeType: string;
  content: string; // base64
  preview: string; // data URL for thumbnail
  name: string;
}

interface ChatInputProps {
  onSend: (text: string, attachments?: Attachment[]) => void;
  onAbort: () => void;
}

const ACCEPTED_TYPES = "image/png,image/jpeg,image/gif,image/webp";
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

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

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [inputValue]);

  // Focus on mount
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
    <div className="bg-zinc-950 px-4 pb-4 pt-2">
      <div className="max-w-3xl mx-auto">
        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-2 px-1">
            {attachments.map((att, i) => (
              <div key={i} className="relative group/att">
                <img
                  src={att.preview}
                  alt={att.name}
                  className="w-14 h-14 rounded-lg object-cover border border-zinc-700"
                />
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-600 text-white hover:bg-red-600 flex items-center justify-center opacity-0 group-hover/att:opacity-100 transition-opacity"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input container */}
        <div
          className={`relative flex items-end bg-zinc-900 rounded-2xl border transition-colors ${
            dragOver
              ? "border-emerald-500/50 bg-emerald-950/10"
              : "border-zinc-800 focus-within:border-zinc-600"
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

          {/* Attach button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!isConnected}
            className="self-end mb-3 ml-3 p-1 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-30"
            title="Anexar imagem"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
          </button>

          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={isConnected ? "Envie uma mensagem..." : "Desconectado..."}
            disabled={!isConnected}
            rows={1}
            className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-600 py-3 px-2 resize-none outline-none text-[0.9375rem] max-h-[200px] disabled:opacity-50 leading-relaxed"
          />

          {/* Send / Stop button */}
          {isStreaming ? (
            <button
              onClick={onAbort}
              className="self-end mb-2.5 mr-2.5 p-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-colors"
              title="Parar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={(!inputValue.trim() && attachments.length === 0) || !isConnected}
              className="self-end mb-2.5 mr-2.5 p-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 transition-colors disabled:opacity-20 disabled:hover:bg-zinc-100"
              title="Enviar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          )}
        </div>

        <p className="text-center text-[11px] text-zinc-700 mt-2">
          LomboClaw pode cometer erros. Verifique informações importantes.
        </p>
      </div>
    </div>
  );
}
