const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const PREFIX = "enc:";

function getKeyMaterial(): string {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY env var must be set (min 32 chars)");
  }
  return key;
}

async function deriveKey(keyMaterial: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const raw = enc.encode(keyMaterial.slice(0, 32));
  return crypto.subtle.importKey("raw", raw, { name: ALGORITHM, length: KEY_LENGTH }, false, ["encrypt", "decrypt"]);
}

export async function encryptToken(plaintext: string): Promise<string> {
  if (!plaintext) return plaintext;
  const key = await deriveKey(getKeyMaterial());
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, enc.encode(plaintext));
  const ivHex = Array.from(iv).map((b) => b.toString(16).padStart(2, "0")).join("");
  const ctHex = Array.from(new Uint8Array(ciphertext)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${PREFIX}${ivHex}:${ctHex}`;
}

export async function decryptToken(stored: string): Promise<string> {
  if (!stored || !stored.startsWith(PREFIX)) return stored;
  const key = await deriveKey(getKeyMaterial());
  const body = stored.slice(PREFIX.length);
  const colonIdx = body.indexOf(":");
  if (colonIdx === -1) throw new Error("Invalid encrypted token format");
  const ivHex = body.slice(0, colonIdx);
  const ctHex = body.slice(colonIdx + 1);
  const iv = new Uint8Array(ivHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
  const ciphertext = new Uint8Array(ctHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
  const plainBuf = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, ciphertext);
  return new TextDecoder().decode(plainBuf);
}
