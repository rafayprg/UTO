// Shared helpers for the developer text ops: JSON input parsing, option reading and identifier naming.
import type { OptionValue } from "./types";

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type JsonObject = { [key: string]: Json };

/** Parses JSON and turns the engine's error into a message with line and column. */
export function parseJson(input: string, what = "input"): Json {
  const text = input.trim();
  if (!text) throw new Error(`Paste some JSON into the ${what} first.`);
  try {
    return JSON.parse(text) as Json;
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    const at = /position (\d+)/.exec(message);
    if (at) {
      const { line, column } = lineColumn(text, Number(at[1]));
      throw new Error(`Invalid JSON at line ${line}, column ${column}: ${message.replace(/ in JSON at position \d+.*$/, "")}.`);
    }
    throw new Error(`Invalid JSON: ${message}`);
  }
}

export function lineColumn(text: string, index: number): { line: number; column: number } {
  const before = text.slice(0, index).split("\n");
  return { line: before.length, column: before[before.length - 1].length + 1 };
}

export function isObject(value: Json | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Reads a numeric option, falling back when the field was cleared, and clamps it. */
export function numOpt(value: OptionValue | undefined, fallback: number, min: number, max: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (value === "" || value === undefined || !Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

export function strOpt(value: OptionValue | undefined, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

/** Splits camelCase, snake_case, kebab-case and spaced keys into lowercase words. */
export function words(key: string): string[] {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map(word => word.toLowerCase());
}

const cap = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

export function pascal(key: string): string {
  const name = words(key).map(cap).join("");
  if (!name) return "Field";
  return /^[0-9]/.test(name) ? `N${name}` : name;
}

export function camel(key: string): string {
  const name = pascal(key);
  return name.charAt(0).toLowerCase() + name.slice(1);
}

export function snake(key: string): string {
  const name = words(key).join("_");
  if (!name) return "field";
  return /^[0-9]/.test(name) ? `n_${name}` : name;
}

/** "addresses" → "address", "categories" → "category". Used to name array item types. */
export function singular(word: string): string {
  if (/ies$/i.test(word)) return word.slice(0, -3) + "y";
  if (/(ss|us)$/i.test(word)) return word;
  if (/(sh|ch|x|z)es$/i.test(word)) return word.slice(0, -2);
  if (/s$/i.test(word) && word.length > 1) return word.slice(0, -1);
  return word;
}

export function indent(text: string, spaces: number): string {
  const pad = " ".repeat(spaces);
  return text.split("\n").map(line => (line ? pad + line : line)).join("\n");
}

export function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/** Uppercase hex of random bytes from the platform CSPRNG. */
export function randomBytes(count: number): Uint8Array {
  const bytes = new Uint8Array(count);
  crypto.getRandomValues(bytes);
  return bytes;
}

/** Unbiased random integer in [0, max). */
export function randomInt(max: number): number {
  if (max <= 1) return 0;
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buffer);
    if (buffer[0] < limit) return buffer[0] % max;
  }
}

/** Own-property check that ignores the prototype chain (so keys like "toString" behave). */
export function has(obj: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/** Sets a key as an own data property, so a "__proto__" key from user input cannot change the prototype. */
export function setOwn<T>(obj: Record<string, T>, key: string, value: T): void {
  Object.defineProperty(obj, key, { value, enumerable: true, writable: true, configurable: true });
}
