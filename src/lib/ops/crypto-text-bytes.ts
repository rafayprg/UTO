// Byte helpers shared by the crypto-text modules: UTF-8, hex and Base64 conversion,
// plus the common "input format" / "output format" options used by hash and cipher pages.
import type { OptionField, OptionValues } from "./types";

export function utf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export function fromUtf8(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("The decoded bytes are not valid UTF-8 text. Try a hex output instead.");
  }
}

export function toHex(bytes: Uint8Array, separator = ""): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join(separator);
}

export function fromHex(value: string): Uint8Array {
  const clean = value.replace(/0x/gi, "").replace(/[\s:,-]/g, "");
  if (!/^[0-9a-fA-F]*$/.test(clean)) throw new Error("This is not valid hex. Only 0–9 and a–f are allowed (spaces, colons and 0x prefixes are ignored).");
  if (clean.length % 2 !== 0) throw new Error("Hex input must have an even number of digits (two per byte).");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

export function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

export function toBase64Url(bytes: Uint8Array): string {
  return toBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64(value: string): Uint8Array {
  const clean = value.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean) || clean.length % 4 === 1) throw new Error("This is not valid Base64. Only A–Z, a–z, 0–9, +, / (or - and _) and = padding are allowed.");
  const padded = clean.replace(/=+$/, "") + "=".repeat((4 - (clean.replace(/=+$/, "").length % 4)) % 4);
  return Uint8Array.from(atob(padded), char => char.charCodeAt(0));
}

export function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/** A copy backed by a plain ArrayBuffer, which is what Web Crypto's BufferSource type wants. */
export function buf(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(new ArrayBuffer(bytes.length));
  out.set(bytes);
  return out;
}

export function randomBytes(length: number): Uint8Array {
  const out = new Uint8Array(length);
  crypto.getRandomValues(out);
  return out;
}

export const inputFormatOption: OptionField = {
  id: "inputFormat", label: "Input is", type: "select", default: "text",
  choices: [["text", "Text (UTF-8)"], ["hex", "Hex bytes"], ["base64", "Base64 bytes"]],
};

export const outputFormatOption: OptionField = {
  id: "outputFormat", label: "Output as", type: "select", default: "hex",
  choices: [["hex", "Hex (lowercase)"], ["HEX", "Hex (uppercase)"], ["base64", "Base64"]],
};

export function readInput(input: string, options: OptionValues): Uint8Array {
  if (options.inputFormat === "hex") return fromHex(input);
  if (options.inputFormat === "base64") return fromBase64(input);
  return utf8(input);
}

export function formatBytes(bytes: Uint8Array, options: OptionValues): string {
  if (options.outputFormat === "base64") return toBase64(bytes);
  if (options.outputFormat === "HEX") return toHex(bytes).toUpperCase();
  return toHex(bytes);
}

/** Big-endian bytes of an unsigned integer of `byteLength` bytes. */
export function uintBytes(value: number | bigint, byteLength: number): Uint8Array {
  let rest = BigInt(value);
  const out = new Uint8Array(byteLength);
  for (let i = byteLength - 1; i >= 0; i -= 1) {
    out[i] = Number(rest & BigInt(255));
    rest >>= BigInt(8);
  }
  return out;
}
