import type { TextOp } from "./types";
import { baseOps } from "./crypto-text-base.ts";
import { encodeOps } from "./crypto-text-encode.ts";
import { encode2Ops } from "./crypto-text-encode2.ts";
import { hashOps } from "./crypto-text-hash.ts";

function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToUtf8(value: string): string {
  const clean = value.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) throw new Error("This is not valid Base64. Only A–Z, a–z, 0–9, +, / and = padding are allowed.");
  const padded = clean + "=".repeat((4 - (clean.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export const ops: Record<string, TextOp> = {
  "base64-encode": {
    input: { label: "Text to encode", example: "Hello, world! ✓" },
    options: [{ id: "urlSafe", label: "URL-safe alphabet (- and _, no padding)", type: "checkbox", default: false }],
    outputLabel: "Base64",
    run(input, options) {
      const encoded = utf8ToBase64(input);
      return options.urlSafe ? encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : encoded;
    },
  },
  "base64-decode": {
    input: { label: "Base64 to decode", example: "SGVsbG8sIHdvcmxkISDinJM=" },
    outputLabel: "Decoded text",
    run(input) {
      try { return base64ToUtf8(input); }
      catch (error) { throw error instanceof Error && error.message.startsWith("This is") ? error : new Error("The decoded bytes are not valid UTF-8 text."); }
    },
  },
  ...baseOps,
  ...encodeOps,
  ...encode2Ops,
  ...hashOps,
};
