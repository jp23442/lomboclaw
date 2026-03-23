# ⚡ LomboClaw

<p align="center">
  <img src="public/lomboclaw-banner.svg" alt="LomboClaw" width="600">
</p>

<p align="center">
  <strong>A custom web UI for the OpenClaw Gateway</strong>
</p>

<p align="center">
  <a href="https://github.com/jp23442/lomboclaw"><img src="https://img.shields.io/badge/status-alpha-orange?style=for-the-badge" alt="Alpha"></a>
  <a href="https://github.com/jp23442/lomboclaw/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
  <a href="https://openclaw.ai"><img src="https://img.shields.io/badge/powered_by-OpenClaw-emerald?style=for-the-badge" alt="Powered by OpenClaw"></a>
</p>

---

**LomboClaw** is a custom web interface for [OpenClaw](https://github.com/openclaw/openclaw) — dark-themed, real-time streaming chat with multi-model support, remote access via VPN, and full gateway management from the browser.

<img width="1693" height="811" alt="image" src="https://github.com/user-attachments/assets/e1b58322-055a-481e-8582-af4da521884c" />

Also ships with OpenClaw backend patches for **automatic memory recall via RAG** before each response.

## Features

### Frontend
- Real-time chat via WebSocket (OpenClaw protocol v3)
- **Login Screen** — password auth + Ed25519 device pairing
- **Model Selector** — switch models on-the-fly with provider logos (OpenAI, Anthropic, Google, Meta, etc.)
- **Provider Management** — add any OpenAI-compatible API (OpenRouter, Groq, DeepSeek, xAI, Mistral, etc.) directly from the UI
- **Settings Panel** — full visual editor for all gateway config sections (toggles, selects, arrays, nested objects)
- **Thinking/Reasoning** — live visualization of model reasoning
- **Tool Calls** — Claude Code-style rendering (diffs, terminal output, file read/write)
- **File attachments** — drag & drop, paste, upload with preview (images, PDF, code, text)
- **Debug Panel** — live logs, session export (JSON/Markdown), raw state inspection
- Sidebar with search and temporal grouping (Today/Yesterday/Older)
- Session, model and auth persistence in localStorage
- PWA-ready (manifest + icons for home screen install)
- Pure JS Ed25519 device auth (no crypto.subtle required — works over HTTP/mobile)
- Auto-reconnect on tab background return (Safari/iOS)
- Dynamic host detection for remote access (VPN, Tailscale, LAN)

### Backend patches
- **Memory Recall** — automatically searches workspace memory before responding
  - Uses OpenClaw's native memory search (Gemini embeddings)
  - Token overlap + score critique, injects up to 3 snippets into the prompt
- **Live Memory Capture** — detects important facts and saves to `MEMORY.md`
  - Auto-classification: HARDWARE, CONFIG, PROJECT, PREFERENCE, NOTE
  - Token similarity deduplication
  - Auto-sync with memory index

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 + React 19 |
| Styling | Tailwind CSS 4 |
| State | Zustand |
| Crypto | @noble/curves (Ed25519), @noble/hashes (SHA-256) |
| Markdown | react-markdown + rehype-highlight + remark-gfm |
| Backend | OpenClaw Gateway (Node.js) |
| Embeddings | Gemini Embedding 001 |

## Structure

```
lomboclaw/
├── src/
│   ├── app/              # Next.js app router
│   ├── components/       # React components
│   │   ├── ChatArea.tsx         # Main chat area
│   │   ├── ChatInput.tsx        # Input with attachments
│   │   ├── Sidebar.tsx          # Session sidebar
│   │   ├── ModelSelector.tsx    # Model dropdown
│   │   ├── MessageBubble.tsx    # Message bubble
│   │   ├── ThinkingBlock.tsx    # Reasoning block
│   │   ├── ToolCallRenderer.tsx # Tool call rendering
│   │   ├── Settings.tsx         # Full settings panel
│   │   └── ChatDebug.tsx        # Debug & export panel
│   ├── hooks/
│   │   ├── useOpenClaw.ts       # Main client hook
│   │   └── useGatewayInfo.ts    # Models, devices, health
│   └── lib/
│       ├── openclaw-client.ts   # WebSocket client
│       ├── device-crypto.ts     # Ed25519 auth (pure JS)
│       └── store.ts             # Zustand store + localStorage
├── backend/
│   └── gateway-patches/         # OpenClaw source patches
│       ├── chat-memory.ts       # Memory recall + capture
│       ├── chat-memory.test.ts
│       └── chat.ts.patch        # Integration diff
├── public/                      # PWA assets
└── .env.example                 # Config template
```

## Quick Start

### 1. Prerequisites
- [Node.js 22+](https://nodejs.org/)
- [OpenClaw](https://github.com/openclaw/openclaw) running (`openclaw gateway`)

### 2. Setup

```bash
git clone https://github.com/jp23442/lomboclaw.git
cd lomboclaw
cp .env.example .env.local
# Edit .env.local with your gateway password and device keys
npm install
```

### 3. Run

```bash
npm run dev
# Open http://localhost:3000
```

### 4. Remote access (VPN / Tailscale / LAN)

LomboClaw auto-detects the hostname and connects to the gateway on port 18789. To enable remote access:

1. Set `gateway.bind: "custom"` and `gateway.customBindHost: "0.0.0.0"` in `openclaw.json`
2. Add your remote origin to `gateway.controlUI.allowedOrigins`
3. Access via your VPN/LAN IP: `http://<your-ip>:3000`

### 5. Apply backend patches (optional)

To enable memory recall in the gateway:

```bash
# Copy patch files into OpenClaw source
cp backend/gateway-patches/chat-memory.ts <openclaw-source>/src/gateway/server-methods/
cp backend/gateway-patches/chat-memory.test.ts <openclaw-source>/src/gateway/server-methods/

# Apply the patch
cd <openclaw-source>
git apply backend/gateway-patches/chat.ts.patch

# Configure in openclaw.json
# agents.defaults.memorySearch.enabled = true
# agents.defaults.memorySearch.provider = "gemini"
# agents.defaults.memorySearch.model = "gemini-embedding-001"

# Rebuild and restart
pnpm build && openclaw gateway
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_OPENCLAW_PASSWORD` | Gateway password (set in `openclaw.json`) |
| `NEXT_PUBLIC_DEVICE_ID` | Paired device ID (hex) |
| `NEXT_PUBLIC_DEVICE_PUBLIC_KEY` | Ed25519 public key (base64url) |
| `NEXT_PUBLIC_DEVICE_PRIVATE_KEY` | Ed25519 private key (base64url) |

> If device variables are not set, LomboClaw automatically generates a key pair and stores it in the browser's IndexedDB.

## Screenshots

> _Coming soon_

## Roadmap

- [ ] Memory panel in the frontend (view/edit memories)
- [ ] Memory recall status endpoint in the backend
- [ ] Full OpenClaw fork with all patches integrated
- [ ] Customizable themes
- [ ] Voice input/output support
- [ ] Conversation export

## License

[MIT](LICENSE)

---

<p align="center">
  <sub>Built with ⚡ by <a href="https://github.com/jp23442">jp23442</a> — powered by <a href="https://openclaw.ai">OpenClaw</a></sub>
</p>
