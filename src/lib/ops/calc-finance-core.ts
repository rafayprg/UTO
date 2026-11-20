import type { CalcField } from "./types";

// Shared helpers for the finance calculators. Self-contained: no runtime imports.

export interface NumOptions { min?: number; max?: number; integer?: boolean; above?: number }

/** Parses a form value; throws a friendly error when it is missing or out of range. */
export function num(value: string | undefined, label: string, options: NumOptions = {}): number {
  const text = String(value ?? "").replace(/[,$\s]/g, "");
  const parsed = Number(text);
  if (text === "" || !Number.isFinite(parsed)) throw new Error(`Enter a number for ${label}.`);
  if (options.integer && !Number.isInteger(parsed)) throw new Error(`${cap(label)} must be a whole number.`);
  if (options.above !== undefined && parsed <= options.above) throw new Error(`${cap(label)} must be greater than ${options.above}.`);
  if (options.min !== undefined && parsed < options.min) throw new Error(`${cap(label)} must be at least ${options.min}.`);
  if (options.max !== undefined && parsed > options.max) throw new Error(`${cap(label)} must be at most ${options.max}.`);
  return parsed;
}

const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function finite(value: number): number {
  if (!Number.isFinite(value)) throw new Error("That result is too large to calculate. Try smaller values.");
  return Object.is(value, -0) ? 0 : value;
}

/** US dollars, e.g. $1,234.56. */
export function usd(value: number): string {
  const safe = finite(value);
  const rounded = Math.abs(safe) < 0.005 ? 0 : safe;
  return rounded.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/** Currency-neutral amount with two decimals (for VAT/GST, which are not USD taxes). */
export function amount(value: number): string {
  const safe = finite(value);
  const rounded = Math.abs(safe) < 0.005 ? 0 : safe;
  return rounded.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Plain number with up to `digits` decimals. */
export function fmt(value: number, digits = 2): string {
  const safe = finite(value);
  const rounded = Number(safe.toFixed(digits));
  return (rounded === 0 ? 0 : rounded).toLocaleString("en-US", { maximumFractionDigits: digits });
}

export const pct = (ratio: number, digits = 2) => `${fmt(ratio * 100, digits)}%`;

/** Parses "1000, 2000 3000" or one value per line. */
export function numberList(text: string | undefined, label: string, { min = 1, allowNegative = true } = {}): number[] {
  const parts = String(text ?? "").replace(/\$/g, "").split(/[\s,;]+/).filter(Boolean);
  const values = parts.map(part => Number(part));
  const bad = parts.find((part, index) => !Number.isFinite(values[index]));
  if (bad !== undefined) throw new Error(`"${bad}" in ${label} is not a number.`);
  if (!allowNegative && values.some(value => value < 0)) throw new Error(`${cap(label)} cannot contain negative numbers.`);
  if (values.length < min) throw new Error(`Enter at least ${min} value${min === 1 ? "" : "s"} in ${label}.`);
  return values;
}

export const field = (id: string, label: string, def: string, extra: Partial<CalcField> = {}): CalcField => ({ id, label, type: "number", default: def, ...extra });
export const select = (id: string, label: string, def: string, choices: Array<[string, string]>, hint?: string): CalcField => ({ id, label, type: "select", default: def, choices, ...(hint ? { hint } : {}) });
export const textField = (id: string, label: string, def: string, hint?: string): CalcField => ({ id, label, type: "text", default: def, ...(hint ? { hint } : {}) });

export const FINANCE_NOTE = "Estimate only, for planning. Not financial, tax or legal advice.";
