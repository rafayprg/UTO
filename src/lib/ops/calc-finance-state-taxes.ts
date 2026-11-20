import type { CalcOp } from "./types";
import { US_STATE_TAXES, type StateTaxInfo } from "../../data/us-state-taxes.ts";

function num(value: string, label: string, { min = 0, allowZero = true } = {}): number {
  const parsed = Number(String(value).replace(/,/g, "").trim());
  if (value.trim() === "" || !Number.isFinite(parsed)) throw new Error(`Enter a number for ${label}.`);
  if (parsed < min || (!allowZero && parsed === 0)) throw new Error(`${label} must be ${allowZero ? "at least" : "greater than"} ${min}.`);
  return parsed;
}

const usd = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });

export function calculateStateTax(state: StateTaxInfo, income: number): number {
  if (state.type === "none" || !income || income <= 0) return 0;
  if (state.type === "flat") return income * state.rate;
  if (state.brackets && state.brackets.length > 0) {
    let tax = 0;
    const sorted = [...state.brackets].sort((a, b) => a.threshold - b.threshold);
    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      if (income > current.threshold) {
        const taxableInBracket = next ? Math.min(income, next.threshold) - current.threshold : income - current.threshold;
        tax += taxableInBracket * current.rate;
      }
    }
    return tax;
  }
  return income * state.rate;
}

export const stateTaxOps: Record<string, CalcOp> = {};

for (const [, state] of Object.entries(US_STATE_TAXES)) {
  const slug = `${state.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-income-tax-calculator`;
  stateTaxOps[slug] = {
    fields: [
      { id: "income", label: "Gross Annual Income (USD)", type: "number", default: "75000", step: "1000" },
      { id: "deductions", label: "Retirement / Pre-Tax Deductions (USD)", type: "number", default: "5000", step: "500" },
      { id: "filingStatus", label: "Filing Status", type: "select", default: "single", choices: [["single", "Single"], ["married", "Married Filing Jointly"], ["hoh", "Head of Household"]] }
    ],
    note: state.notes,
    compute(v) {
      const gross = num(v.income, "Gross Income", { min: 0 });
      const ded = num(v.deductions, "Deductions", { min: 0 });
      const taxable = Math.max(0, gross - ded);
      const stateTax = calculateStateTax(state, taxable);
      const effectiveRate = gross > 0 ? (stateTax / gross) * 100 : 0;
      const takeHome = Math.max(0, gross - stateTax);

      return {
        results: [
          { label: `${state.name} State Tax Owed`, value: usd(stateTax), primary: true },
          { label: "Effective State Tax Rate", value: `${effectiveRate.toFixed(2)}%` },
          { label: "Taxable State Income", value: usd(taxable) },
          { label: "After-State-Tax Income", value: usd(takeHome) }
        ],
        formula: state.type === "none" ? "State Tax = $0.00 (No state individual income tax)" : state.type === "flat" ? `Tax = Taxable Income × ${(state.rate * 100).toFixed(2)}%` : "Tax = Σ (Income in Bracket_i × Rate_i)"
      };
    }
  };
}
