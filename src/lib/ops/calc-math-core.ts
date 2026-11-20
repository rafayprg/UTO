import type { CalcField } from "./types";

// Shared helpers for the math, stats, health and date calculators. Self-contained: no runtime imports.

export interface NumOptions { min?: number; max?: number; integer?: boolean; above?: number }

const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export function num(value: string | undefined, label: string, options: NumOptions = {}): number {
  const text = String(value ?? "").replace(/[,\s]/g, "");
  const parsed = Number(text);
  if (text === "" || !Number.isFinite(parsed)) throw new Error(`Enter a number for ${label}.`);
  if (options.integer && !Number.isInteger(parsed)) throw new Error(`${cap(label)} must be a whole number.`);
  if (options.above !== undefined && parsed <= options.above) throw new Error(`${cap(label)} must be greater than ${options.above}.`);
  if (options.min !== undefined && parsed < options.min) throw new Error(`${cap(label)} must be at least ${options.min}.`);
  if (options.max !== undefined && parsed > options.max) throw new Error(`${cap(label)} must be at most ${options.max}.`);
  return parsed;
}

/** Readable number: up to 10 significant digits, scientific notation for very large or tiny values. */
export function fmt(value: number, digits = 10): string {
  if (!Number.isFinite(value)) throw new Error("That result is outside the range a browser can calculate.");
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e15 || abs < 1e-6) {
    const [mantissa, exponent] = value.toExponential(digits - 1).split("e");
    return `${String(Number(mantissa))} × 10^${Number(exponent)}`;
  }
  const rounded = Number(value.toPrecision(digits));
  return rounded === 0 ? "0" : rounded.toLocaleString("en-US", { maximumFractionDigits: 20 });
}

/** Parses a list of numbers separated by commas, spaces, semicolons or new lines. */
export function numberList(text: string | undefined, label: string, min = 1): number[] {
  const parts = String(text ?? "").split(/[\s,;]+/).filter(Boolean);
  const values = parts.map(Number);
  const bad = parts.find((_, index) => !Number.isFinite(values[index]));
  if (bad !== undefined) throw new Error(`"${bad}" in ${label} is not a number.`);
  if (values.length < min) throw new Error(`Enter at least ${min} number${min === 1 ? "" : "s"} in ${label}.`);
  return values;
}

/** Whole number as BigInt; accepts commas, spaces and underscores as separators. */
export function bigInt(text: string | undefined, label: string, maxDigits = 30): bigint {
  const clean = String(text ?? "").replace(/[,_\s]/g, "");
  if (!/^-?\d+$/.test(clean)) throw new Error(`Enter a whole number for ${label}.`);
  if (clean.replace("-", "").length > maxDigits) throw new Error(`${cap(label)} can have at most ${maxDigits} digits.`);
  return BigInt(clean);
}

export const absBig = (value: bigint) => (value < 0n ? -value : value);

export function gcdBig(a: bigint, b: bigint): bigint {
  let [x, y] = [absBig(a), absBig(b)];
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
}

/** Digits with thousands separators, or scientific form when very long. */
export function bigDisplay(value: bigint, maxLength = 40): string {
  const digits = absBig(value).toString();
  const sign = value < 0n ? "−" : "";
  if (digits.length <= maxLength) return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}${digits[0]}.${digits.slice(1, 7)} × 10^${digits.length - 1}`;
}

export const field = (id: string, label: string, def: string, extra: Partial<CalcField> = {}): CalcField => ({ id, label, type: "number", default: def, ...extra });
export const select = (id: string, label: string, def: string, choices: Array<[string, string]>, hint?: string): CalcField => ({ id, label, type: "select", default: def, choices, ...(hint ? { hint } : {}) });
export const textField = (id: string, label: string, def: string, hint?: string): CalcField => ({ id, label, type: "text", default: def, ...(hint ? { hint } : {}) });
export const dateField = (id: string, label: string, def: string, hint?: string): CalcField => ({ id, label, type: "date", default: def, ...(hint ? { hint } : {}) });
