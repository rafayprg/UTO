import type { CalcOp } from "./types";
import { businessOps } from "./calc-finance-business.ts";
import { investOps } from "./calc-finance-invest.ts";
import { loanOps } from "./calc-finance-loans.ts";
import { saasOps } from "./calc-finance-saas.ts";
import { stateTaxOps } from "./calc-finance-state-taxes.ts";
import { extendedFinanceOps } from "./calc-finance-extended.ts";
import { globalTaxOps } from "./calc-global-tax.ts";

function num(value: string, label: string, { min = -Infinity, allowZero = true } = {}): number {
  const parsed = Number(String(value).replace(/,/g, "").trim());
  if (value.trim() === "" || !Number.isFinite(parsed)) throw new Error(`Enter a number for ${label}.`);
  if (parsed < min || (!allowZero && parsed === 0)) throw new Error(`${label} must be ${allowZero ? "at least" : "greater than"} ${min}.`);
  return parsed;
}
const usd = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });

export const ops: Record<string, CalcOp> = {
  ...businessOps,
  ...saasOps,
  ...loanOps,
  ...investOps,
  ...stateTaxOps,
  ...extendedFinanceOps,
  ...globalTaxOps,
  "compound-interest": {
    fields: [
      { id: "principal", label: "Starting amount (USD)", type: "number", default: "10000" },
      { id: "rate", label: "Annual interest rate (%)", type: "number", default: "5", step: "0.01" },
      { id: "years", label: "Years", type: "number", default: "10" },
      { id: "freq", label: "Compounding", type: "select", default: "12", choices: [["1", "Yearly"], ["4", "Quarterly"], ["12", "Monthly"], ["365", "Daily"]] },
    ],
    note: "Assumes a constant rate and no additional deposits, taxes, or fees.",
    compute(v) {
      const p = num(v.principal, "the starting amount", { min: 0 });
      const r = num(v.rate, "the rate", { min: 0 }) / 100;
      const t = num(v.years, "the years", { min: 0 });
      const n = num(v.freq, "the compounding frequency", { min: 1 });
      const total = p * (1 + r / n) ** (n * t);
      if (!Number.isFinite(total)) throw new Error("That result is too large to calculate.");
      return {
        results: [
          { label: "Future value", value: usd(total), primary: true },
          { label: "Interest earned", value: usd(total - p) },
        ],
        formula: "A = P × (1 + r/n)^(n × t)",
      };
    },
  },
};
