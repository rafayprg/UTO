import type { UsStateData } from "@/data/programmatic/us-states";

// 2026 federal brackets (single filer) and standard deduction.
export const FEDERAL_BRACKETS_SINGLE = [
  { threshold: 0, rate: 0.1 },
  { threshold: 11600, rate: 0.12 },
  { threshold: 47150, rate: 0.22 },
  { threshold: 100525, rate: 0.24 },
  { threshold: 191950, rate: 0.32 },
  { threshold: 243725, rate: 0.35 },
  { threshold: 609350, rate: 0.37 },
] as const;

export const FEDERAL_STANDARD_DEDUCTION = 14600;
export const SOCIAL_SECURITY_WAGE_BASE = 168600;
const SOCIAL_SECURITY_RATE = 0.062;
const MEDICARE_RATE = 0.0145;

export const PAY_PERIODS = { annual: 1, monthly: 12, biweekly: 26, weekly: 52 } as const;
export type PayPeriod = keyof typeof PAY_PERIODS;

type Bracket = { threshold: number; rate: number };

function taxFromBrackets(taxable: number, brackets: readonly Bracket[]): number {
  return brackets.reduce((total, bracket, index) => {
    if (taxable <= bracket.threshold) return total;
    const next = brackets[index + 1];
    const ceiling = next ? Math.min(taxable, next.threshold) : taxable;
    return total + (ceiling - bracket.threshold) * bracket.rate;
  }, 0);
}

export function federalIncomeTax(taxableBase: number): number {
  return taxFromBrackets(Math.max(0, taxableBase - FEDERAL_STANDARD_DEDUCTION), FEDERAL_BRACKETS_SINGLE);
}

export function stateIncomeTax(state: UsStateData, taxableBase: number): number {
  if (!state.hasIncomeTax) return 0;
  const taxable = Math.max(0, taxableBase - state.standardDeductionSingle);
  if (state.incomeTaxType === "flat" && state.flatRate) return taxable * (state.flatRate / 100);
  if (state.brackets && state.brackets.length > 0) return taxFromBrackets(taxable, state.brackets);
  return taxable * (state.topMarginalRate / 100);
}

export interface PaycheckEstimate {
  federalTax: number;
  socialSecurity: number;
  medicare: number;
  stateTax: number;
  totalTaxes: number;
  netAnnual: number;
  effectiveRate: number;
}

/** Single-filer W-2 estimate. Mirrors the paycheck mode of StateTaxPaycheckEngine. */
export function estimateW2Paycheck(state: UsStateData, annualGross: number): PaycheckEstimate {
  const gross = Math.max(0, annualGross);
  const federalTax = federalIncomeTax(gross);
  const socialSecurity = Math.min(gross, SOCIAL_SECURITY_WAGE_BASE) * SOCIAL_SECURITY_RATE;
  const medicare = gross * MEDICARE_RATE;
  const stateTax = stateIncomeTax(state, gross);
  const totalTaxes = federalTax + socialSecurity + medicare + stateTax;
  return {
    federalTax,
    socialSecurity,
    medicare,
    stateTax,
    totalTaxes,
    netAnnual: Math.max(0, gross - totalTaxes),
    effectiveRate: gross > 0 ? totalTaxes / gross : 0,
  };
}
