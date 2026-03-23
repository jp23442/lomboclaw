"use client";

// Provider logo icons for the model selector
// Each returns a small colored icon representing the AI provider

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#10a37f",
  anthropic: "#d4a27f",
  google: "#4285f4",
  gemini: "#4285f4",
  meta: "#0668e1",
  llama: "#0668e1",
  ollama: "#ffffff",
  mistral: "#f7d046",
  deepseek: "#4d6bfe",
  xai: "#ffffff",
  grok: "#ffffff",
  cohere: "#39594d",
  perplexity: "#20b2aa",
};

function getProviderKey(provider: string, modelId: string): string {
  const p = provider.toLowerCase();
  const m = modelId.toLowerCase();

  if (p.includes("openai") || m.includes("gpt") || m.includes("o1-") || m.includes("o3-") || m.includes("o4-")) return "openai";
  if (p.includes("anthropic") || m.includes("claude")) return "anthropic";
  if (p.includes("google") || m.includes("gemini")) return "google";
  if (p.includes("meta") || m.includes("llama")) return "meta";
  if (p.includes("ollama")) return "ollama";
  if (p.includes("mistral") || m.includes("mistral") || m.includes("mixtral")) return "mistral";
  if (p.includes("deepseek") || m.includes("deepseek")) return "deepseek";
  if (p.includes("xai") || m.includes("grok")) return "xai";
  if (p.includes("cohere") || m.includes("command")) return "cohere";
  if (p.includes("perplexity")) return "perplexity";
  return "";
}

export function ProviderIcon({ provider, modelId, size = 16 }: { provider: string; modelId: string; size?: number }) {
  const key = getProviderKey(provider, modelId);
  const color = PROVIDER_COLORS[key] || "#71717a";

  switch (key) {
    case "openai":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M22.28 9.37a5.99 5.99 0 00-.52-4.93 6.07 6.07 0 00-6.54-2.9A5.99 5.99 0 0010.68 0a6.07 6.07 0 00-5.78 4.18 5.99 5.99 0 00-4 2.9 6.07 6.07 0 00.74 7.13 5.99 5.99 0 00.52 4.93 6.07 6.07 0 006.54 2.9A5.99 5.99 0 0013.24 24a6.07 6.07 0 005.78-4.18 5.99 5.99 0 004-2.9 6.07 6.07 0 00-.74-7.55zM13.24 22.44a4.48 4.48 0 01-2.88-1.05l.14-.08 4.78-2.76a.78.78 0 00.39-.67v-6.74l2.02 1.17a.07.07 0 01.04.06v5.58a4.51 4.51 0 01-4.49 4.49zM3.6 18.34a4.47 4.47 0 01-.54-3.01l.14.09 4.78 2.76a.77.77 0 00.78 0l5.83-3.37v2.33a.07.07 0 01-.03.06l-4.83 2.79a4.51 4.51 0 01-6.13-1.65zM2.34 7.89A4.47 4.47 0 014.68 5.9v5.69a.78.78 0 00.39.67l5.83 3.37-2.02 1.17a.07.07 0 01-.07 0L4 13.99a4.51 4.51 0 01-1.66-6.1zM19.26 11.97l-5.83-3.37 2.02-1.16a.07.07 0 01.07 0l4.83 2.79a4.49 4.49 0 01-.7 8.1v-5.69a.78.78 0 00-.39-.67zM21.29 8.63l-.14-.08-4.78-2.77a.77.77 0 00-.78 0L9.76 9.15V6.82a.07.07 0 01.03-.06l4.83-2.79a4.5 4.5 0 016.67 4.66zM8.65 12.93l-2.02-1.17a.07.07 0 01-.04-.06V6.12a4.5 4.5 0 017.37-3.45l-.14.08-4.78 2.76a.78.78 0 00-.39.68v6.74zm1.1-2.36l2.6-1.5 2.6 1.5v3l-2.6 1.5-2.6-1.5v-3z" fill={color}/>
        </svg>
      );

    case "anthropic":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M13.83 3h3.34L24 21h-3.34L13.83 3zm-6.66 0h3.34l3.24 9.32L12.22 16 7.17 3zM3.34 21L0 21l3.56-10.24 1.66 4.78L3.34 21z" fill={color}/>
        </svg>
      );

    case "google":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.98 10.98 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      );

    case "meta":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M6.915 4.03c-1.968 0-3.541 1.897-4.204 4.678C2.22 10.567 2 12.807 2 14.07c0 3.013 1.128 4.93 3.048 4.93 1.27 0 2.46-.97 3.548-2.886.808-1.42 1.524-3.166 2.13-5.2H9.106c.444-1.48.974-2.82 1.58-3.976C11.815 4.96 13.16 4.03 14.63 4.03c1.27 0 2.317.587 3.065 1.546.746.956 1.305 2.44 1.305 4.494 0 1.264-.193 3.503-.685 5.362C17.653 18.04 16.327 19 15.085 19c-.635 0-1.148-.222-1.56-.572l-.252.846C13.878 20.32 14.577 21 16.085 21c2.047 0 3.502-1.573 4.295-4.03.482-1.5.62-3.504.62-4.9 0-2.554-.684-4.464-1.773-5.77C18.148 5.007 16.635 4.03 14.63 4.03c-1.97 0-3.544 1.3-4.544 3.39-.367.764-.706 1.614-1.01 2.544h1.56c-.558 1.88-1.228 3.476-1.956 4.748-.9 1.574-1.745 2.288-2.565 2.288-.76 0-1.165-.79-1.165-2.93 0-1.18.2-3.226.656-4.92.503-1.87 1.312-3.12 2.31-3.12z" fill={color}/>
        </svg>
      );

    case "ollama":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="10" r="6" stroke={color} strokeWidth="1.8" fill="none"/>
          <circle cx="10" cy="9" r="1.2" fill={color}/>
          <circle cx="14" cy="9" r="1.2" fill={color}/>
          <path d="M9.5 12.5c0 0 1.2 1.5 2.5 1.5s2.5-1.5 2.5-1.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none"/>
          <path d="M8 16c0 2 1.8 4 4 4s4-2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        </svg>
      );

    case "mistral":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect x="2" y="3" width="4" height="4" fill={color}/>
          <rect x="18" y="3" width="4" height="4" fill={color}/>
          <rect x="2" y="9" width="4" height="4" fill={color}/>
          <rect x="10" y="9" width="4" height="4" fill={color}/>
          <rect x="18" y="9" width="4" height="4" fill={color}/>
          <rect x="2" y="15" width="4" height="4" fill={color}/>
          <rect x="6" y="15" width="4" height="4" fill="#f97316"/>
          <rect x="10" y="15" width="4" height="4" fill={color}/>
          <rect x="14" y="15" width="4" height="4" fill="#f97316"/>
          <rect x="18" y="15" width="4" height="4" fill={color}/>
        </svg>
      );

    case "deepseek":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none"/>
          <path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"/>
          <circle cx="12" cy="14" r="2" fill={color}/>
        </svg>
      );

    case "xai":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M4 4l7 8-7 8h3.5L12 14.5 16.5 20H20l-7-8 7-8h-3.5L12 9.5 7.5 4H4z" fill={color}/>
        </svg>
      );

    case "cohere":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none"/>
          <path d="M8 12h8M12 8v8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );

    case "perplexity":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      );

    default:
      // Generic AI chip icon
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
          <rect x="6" y="6" width="12" height="12" rx="2"/>
          <path d="M6 10H4M6 14H4M20 10h-2M20 14h-2M10 6V4M14 6V4M10 20v-2M14 20v-2"/>
        </svg>
      );
  }
}

export function getProviderName(provider: string, modelId: string): string {
  const key = getProviderKey(provider, modelId);
  const names: Record<string, string> = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    google: "Google",
    meta: "Meta",
    ollama: "Ollama",
    mistral: "Mistral",
    deepseek: "DeepSeek",
    xai: "xAI",
    cohere: "Cohere",
    perplexity: "Perplexity",
  };
  return names[key] || provider || "Unknown";
}
