import { ed25519 } from "@noble/curves/ed25519.js";
import { sha256 } from "@noble/hashes/sha2.js";

const DB_NAME = "openclaw-ui-keys";
const DB_STORE = "device";

export interface DeviceIdentity {
  deviceId: string;
  publicKey: string; // base64url
  privateKey: string; // base64url
}

// --- Base64url helpers ---

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(str: string): Uint8Array {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  s += "=".repeat((4 - (s.length % 4)) % 4);
  const binary = atob(s);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

// --- Key management ---

function computeDeviceId(publicKeyBytes: Uint8Array): string {
  const hash = sha256(publicKeyBytes);
  return bytesToHex(hash);
}

function generateIdentity(): DeviceIdentity {
  const privateKeyBytes = ed25519.utils.randomSecretKey();
  const publicKeyBytes = ed25519.getPublicKey(privateKeyBytes);

  const deviceId = computeDeviceId(publicKeyBytes);
  const publicKey = base64UrlEncode(publicKeyBytes);
  const privateKey = base64UrlEncode(privateKeyBytes);

  return { deviceId, publicKey, privateKey };
}

// --- IndexedDB persistence ---

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(DB_STORE)) {
        req.result.createObjectStore(DB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadIdentity(): Promise<DeviceIdentity | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readonly");
    const store = tx.objectStore(DB_STORE);
    const req = store.get("current");
    req.onsuccess = () => { db.close(); resolve(req.result ?? null); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

async function saveIdentity(identity: DeviceIdentity): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put(identity, "current");
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

// Shared device identity from env vars - all LomboClaw instances use the same keys
function getSharedDevice(): DeviceIdentity | null {
  const deviceId = process.env.NEXT_PUBLIC_DEVICE_ID;
  const publicKey = process.env.NEXT_PUBLIC_DEVICE_PUBLIC_KEY;
  const privateKey = process.env.NEXT_PUBLIC_DEVICE_PRIVATE_KEY;
  if (deviceId && publicKey && privateKey) {
    return { deviceId, publicKey, privateKey };
  }
  return null;
}

export async function getOrCreateIdentity(): Promise<DeviceIdentity> {
  // Prefer shared keys from env so all clients (PC, mobile) use the same paired device
  const shared = getSharedDevice();
  if (shared) return shared;

  // Fallback: generate/load from IndexedDB
  const existing = await loadIdentity();
  if (existing) return existing;

  const identity = generateIdentity();
  await saveIdentity(identity);
  return identity;
}

// --- Signing (pure JS, no crypto.subtle needed) ---

export function buildSignPayloadV2(params: {
  deviceId: string;
  clientId: string;
  clientMode: string;
  role: string;
  scopes: string[];
  signedAtMs: number;
  token: string | null;
  nonce: string;
}): string {
  const scopes = params.scopes.join(",");
  const token = params.token ?? "";
  return [
    "v2",
    params.deviceId,
    params.clientId,
    params.clientMode,
    params.role,
    scopes,
    String(params.signedAtMs),
    token,
    params.nonce,
  ].join("|");
}

export function signPayload(privateKeyB64: string, payload: string): string {
  const privateKeyBytes = base64UrlDecode(privateKeyB64);
  const messageBytes = new TextEncoder().encode(payload);
  const signature = ed25519.sign(messageBytes, privateKeyBytes);
  return base64UrlEncode(signature);
}
