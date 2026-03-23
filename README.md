# 🦞 LomboClaw

<p align="center">
  <img src="logo.svg" alt="LomboClaw" width="160">
</p>

<p align="center">
  <strong>WebUI para o OpenClaw Gateway</strong>
</p>

<p align="center">
  <a href="https://github.com/jp23442/lomboclaw"><img src="https://img.shields.io/badge/status-alpha-orange?style=for-the-badge" alt="Alpha"></a>
  <a href="https://github.com/jp23442/lomboclaw/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
  <a href="https://openclaw.ai"><img src="https://img.shields.io/badge/powered_by-OpenClaw-emerald?style=for-the-badge" alt="Powered by OpenClaw"></a>
</p>

---

**LomboClaw** é uma interface web custom para o [OpenClaw](https://github.com/openclaw/openclaw) — estilo OpenWebUI, com tema dark, streaming em tempo real e acesso via Tailscale no celular.

Inclui também patches no backend do OpenClaw para **memory recall automático via RAG** antes de cada resposta.

## Features

### Frontend
- Chat em tempo real via WebSocket (protocolo OpenClaw v3)
- **Login Screen** — autenticação por senha + Ed25519 device pairing
- **Model Selector** — troca de modelo on-the-fly com logos dos providers (OpenAI, Anthropic, Google, Meta, etc.)
- **Settings Panel** — editor visual completo de todas as 37 seções de config do gateway (toggles, selects, arrays, nested objects)
- **Thinking/Reasoning** — visualização do raciocínio do modelo em tempo real
- **Tool Calls** — renderização estilo Claude Code (diffs, terminal, file read/write)
- **Image attachments** — drag & drop, paste, upload com preview
- **Gerenciamento completo** — Agentes, Skills, Cron jobs, TTS, Aprovações, Sessões, Dispositivos
- Sidebar com busca, agrupamento temporal (Hoje/Ontem/Anteriores)
- Persistência de sessões, modelo e auth em localStorage
- PWA-ready (manifest + ícones para home screen)
- Ed25519 device auth em JS puro (sem crypto.subtle, funciona em HTTP/mobile)
- Reconnect automático ao voltar de background (Safari/iOS)
- Acesso remoto via Tailscale (detecção dinâmica de host)

### Backend (patches)
- **Memory Recall** — busca automática na memória do workspace antes de responder
  - Detecta cues em pt-BR: "lembra", "hardware", "projeto", "config", etc.
  - Usa memory search nativa do OpenClaw (Gemini embeddings)
  - Critique por overlap de tokens + score, injeta max 3 snippets no prompt
- **Live Memory Capture** — detecta fatos importantes e salva no `MEMORY.md`
  - Classificação automática: HARDWARE, CONFIG, PROJECT, PREFERENCE, NOTE
  - Deduplicação por similaridade de tokens
  - Sync automático com o índice de memória

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 + React 19 |
| Styling | Tailwind CSS 4 |
| State | Zustand |
| Crypto | @noble/curves (Ed25519), @noble/hashes (SHA-256) |
| Markdown | react-markdown + rehype-highlight + remark-gfm |
| Backend | OpenClaw Gateway (Node.js) |
| Embeddings | Gemini Embedding 001 |

## Estrutura

```
lomboclaw/
├── src/
│   ├── app/              # Next.js app router
│   ├── components/       # React components
│   │   ├── ChatArea.tsx       # Área principal de chat
│   │   ├── ChatInput.tsx      # Input com attachments
│   │   ├── Sidebar.tsx        # Sidebar com sessões
│   │   ├── ModelSelector.tsx  # Dropdown de modelos
│   │   ├── MessageBubble.tsx  # Bolha de mensagem
│   │   ├── ThinkingBlock.tsx  # Bloco de reasoning
│   │   ├── ToolCallRenderer.tsx # Renderização de tool calls
│   │   ├── CodeBlock.tsx      # Code blocks com syntax
│   │   └── StreamingMessage.tsx # Mensagem em streaming
│   ├── hooks/
│   │   ├── useOpenClaw.ts     # Hook principal do client
│   │   └── useGatewayInfo.ts  # Models, devices, health
│   └── lib/
│       ├── openclaw-client.ts # WebSocket client
│       ├── device-crypto.ts   # Ed25519 auth (pure JS)
│       └── store.ts           # Zustand store + localStorage
├── backend/
│   └── gateway-patches/       # Patches pro OpenClaw source
│       ├── chat-memory.ts     # Memory recall + capture
│       ├── chat-memory.test.ts
│       └── chat.ts.patch      # Diff da integração
├── public/                    # PWA assets
└── .env.example               # Template de configuração
```

## Quick Start

### 1. Pré-requisitos
- [Node.js 22+](https://nodejs.org/)
- [OpenClaw](https://github.com/openclaw/openclaw) rodando (`openclaw gateway`)

### 2. Configurar

```bash
git clone https://github.com/jp23442/lomboclaw.git
cd lomboclaw
cp .env.example .env.local
# Editar .env.local com sua senha do gateway e device keys
npm install
```

### 3. Rodar

```bash
npm run dev
# Acesse http://localhost:3003
```

### 4. Acesso remoto (Tailscale)

O LomboClaw detecta automaticamente o hostname e conecta no gateway pela porta 18789. Para acesso via Tailscale:

1. Configure `gateway.bind: "custom"` e `gateway.customBindHost: "0.0.0.0"` no `openclaw.json`
2. Adicione a origem do Tailscale em `gateway.controlUI.allowedOrigins`
3. Acesse pelo IP do Tailscale: `http://<tailscale-ip>:3003`

### 5. Aplicar patches no backend (opcional)

Para ativar o memory recall no gateway:

```bash
# Copiar chat-memory.ts para o source do OpenClaw
cp backend/gateway-patches/chat-memory.ts <openclaw-source>/src/gateway/server-methods/
cp backend/gateway-patches/chat-memory.test.ts <openclaw-source>/src/gateway/server-methods/

# Aplicar o patch no chat.ts
cd <openclaw-source>
git apply backend/gateway-patches/chat.ts.patch

# Configurar no openclaw.json
# agents.defaults.memorySearch.enabled = true
# agents.defaults.memorySearch.provider = "gemini"
# agents.defaults.memorySearch.model = "gemini-embedding-001"

# Rebuildar e reiniciar
pnpm build && openclaw gateway
```

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_OPENCLAW_PASSWORD` | Senha do gateway (definida no `openclaw.json`) |
| `NEXT_PUBLIC_DEVICE_ID` | ID do device pareado (hex) |
| `NEXT_PUBLIC_DEVICE_PUBLIC_KEY` | Chave pública Ed25519 (base64url) |
| `NEXT_PUBLIC_DEVICE_PRIVATE_KEY` | Chave privada Ed25519 (base64url) |

> Se as variáveis de device não forem definidas, o LomboClaw gera automaticamente um par de chaves e armazena no IndexedDB do browser.

## Screenshots

> _Em breve_

## Roadmap

- [ ] Painel de memória no frontend (visualizar/editar memories)
- [ ] Endpoint de status de memory recall no backend
- [ ] Fork completo do OpenClaw com todas as patches integradas
- [ ] Temas customizáveis
- [ ] Suporte a voice input/output
- [ ] Export de conversas

## Licença

[MIT](LICENSE)

---

<p align="center">
  <sub>Feito com 🦞 por <a href="https://github.com/jp23442">jp23442</a> — powered by <a href="https://openclaw.ai">OpenClaw</a></sub>
</p>
