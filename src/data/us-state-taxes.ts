// Complete dataset of US state income tax rates, brackets, and local rules for 2025-2026.
// Used for programmatic state-by-state 1099 tax estimations.

export interface StateTaxInfo {
  code: string;
  name: string;
  type: "none" | "flat" | "graduated";
  rate: number; // Flat rate or top marginal rate
  brackets?: Array<{ threshold: number; rate: number }>;
  hasLocalTax: boolean;
  notes: string;
}

export const US_STATE_TAXES: Record<string, StateTaxInfo> = {
  AL: { code: "AL", name: "Alabama", type: "graduated", rate: 0.05, brackets: [{ threshold: 0, rate: 0.02 }, { threshold: 500, rate: 0.04 }, { threshold: 3000, rate: 0.05 }], hasLocalTax: true, notes: "Top marginal rate of 5% applies over $3,000." },
  AK: { code: "AK", name: "Alaska", type: "none", rate: 0, hasLocalTax: false, notes: "No state individual income tax." },
  AZ: { code: "AZ", name: "Arizona", type: "flat", rate: 0.025, hasLocalTax: false, notes: "Flat individual income tax rate of 2.5%." },
  AR: { code: "AR", name: "Arkansas", type: "graduated", rate: 0.044, brackets: [{ threshold: 0, rate: 0.02 }, { threshold: 5000, rate: 0.04 }, { threshold: 10000, rate: 0.044 }], hasLocalTax: false, notes: "Top marginal rate of 4.4%." },
  CA: { code: "CA", name: "California", type: "graduated", rate: 0.133, brackets: [{ threshold: 0, rate: 0.01 }, { threshold: 10412, rate: 0.02 }, { threshold: 24684, rate: 0.04 }, { threshold: 38959, rate: 0.06 }, { threshold: 54081, rate: 0.08 }, { threshold: 68350, rate: 0.093 }, { threshold: 349137, rate: 0.103 }, { threshold: 418961, rate: 0.113 }, { threshold: 698271, rate: 0.123 }, { threshold: 1000000, rate: 0.133 }], hasLocalTax: false, notes: "Graduated tax brackets from 1% up to 13.3% including mental health services surtax." },
  CO: { code: "CO", name: "Colorado", type: "flat", rate: 0.044, hasLocalTax: true, notes: "Flat individual income tax rate of 4.4%." },
  CT: { code: "CT", name: "Connecticut", type: "graduated", rate: 0.0699, brackets: [{ threshold: 0, rate: 0.03 }, { threshold: 10000, rate: 0.05 }, { threshold: 50000, rate: 0.055 }, { threshold: 100000, rate: 0.06 }, { threshold: 200000, rate: 0.065 }, { threshold: 250000, rate: 0.069 }, { threshold: 500000, rate: 0.0699 }], hasLocalTax: false, notes: "Progressive rates from 3% to 6.99%." },
  DE: { code: "DE", name: "Delaware", type: "graduated", rate: 0.066, brackets: [{ threshold: 0, rate: 0.0 }, { threshold: 2000, rate: 0.022 }, { threshold: 5000, rate: 0.039 }, { threshold: 10000, rate: 0.048 }, { threshold: 20000, rate: 0.052 }, { threshold: 25000, rate: 0.0555 }, { threshold: 60000, rate: 0.066 }], hasLocalTax: true, notes: "Top marginal rate 6.6% applies over $60,000." },
  FL: { code: "FL", name: "Florida", type: "none", rate: 0, hasLocalTax: false, notes: "No state individual income tax." },
  GA: { code: "GA", name: "Georgia", type: "flat", rate: 0.0539, hasLocalTax: false, notes: "Transitioned to a flat income tax rate of 5.39%." },
  HI: { code: "HI", name: "Hawaii", type: "graduated", rate: 0.11, brackets: [{ threshold: 0, rate: 0.014 }, { threshold: 4800, rate: 0.032 }, { threshold: 9600, rate: 0.055 }, { threshold: 19200, rate: 0.064 }, { threshold: 28800, rate: 0.068 }, { threshold: 38400, rate: 0.072 }, { threshold: 48000, rate: 0.076 }, { threshold: 72000, rate: 0.079 }, { threshold: 96000, rate: 0.0825 }, { threshold: 150000, rate: 0.09 }, { threshold: 175000, rate: 0.10 }, { threshold: 200000, rate: 0.11 }], hasLocalTax: false, notes: "Top rate of 11% applies over $200,000." },
  ID: { code: "ID", name: "Idaho", type: "flat", rate: 0.05695, hasLocalTax: false, notes: "Flat income tax rate of 5.695%." },
  IL: { code: "IL", name: "Illinois", type: "flat", rate: 0.0495, hasLocalTax: false, notes: "Constitutional flat income tax of 4.95%." },
  IN: { code: "IN", name: "Indiana", type: "flat", rate: 0.0305, hasLocalTax: true, notes: "State flat rate of 3.05% plus county income taxes." },
  IA: { code: "IA", name: "Iowa", type: "flat", rate: 0.038, hasLocalTax: true, notes: "Flat individual rate of 3.8%." },
  KS: { code: "KS", name: "Kansas", type: "graduated", rate: 0.0558, brackets: [{ threshold: 0, rate: 0.031 }, { threshold: 15000, rate: 0.0525 }, { threshold: 30000, rate: 0.0558 }], hasLocalTax: false, notes: "Graduated rates with top rate of 5.58%." },
  KY: { code: "KY", name: "Kentucky", type: "flat", rate: 0.04, hasLocalTax: true, notes: "Flat rate of 4.0% plus local occupational taxes." },
  LA: { code: "LA", name: "Louisiana", type: "flat", rate: 0.03, hasLocalTax: false, notes: "Flat income tax rate of 3.0%." },
  ME: { code: "ME", name: "Maine", type: "graduated", rate: 0.0715, brackets: [{ threshold: 0, rate: 0.058 }, { threshold: 26050, rate: 0.0675 }, { threshold: 61600, rate: 0.0715 }], hasLocalTax: false, notes: "Top rate of 7.15% applies over $61,600." },
  MD: { code: "MD", name: "Maryland", type: "graduated", rate: 0.0575, brackets: [{ threshold: 0, rate: 0.02 }, { threshold: 1000, rate: 0.03 }, { threshold: 2000, rate: 0.04 }, { threshold: 3000, rate: 0.0475 }, { threshold: 100000, rate: 0.05 }, { threshold: 125000, rate: 0.0525 }, { threshold: 150000, rate: 0.055 }, { threshold: 250000, rate: 0.0575 }], hasLocalTax: true, notes: "Top state rate of 5.75% plus county income taxes (2.25% - 3.2%)." },
  MA: { code: "MA", name: "Massachusetts", type: "flat", rate: 0.05, hasLocalTax: false, notes: "Flat rate of 5.0% plus 4% surtax on taxable income over $1,000,000." },
  MI: { code: "MI", name: "Michigan", type: "flat", rate: 0.0425, hasLocalTax: true, notes: "Flat rate of 4.25% plus city income taxes where applicable." },
  MN: { code: "MN", name: "Minnesota", type: "graduated", rate: 0.0985, brackets: [{ threshold: 0, rate: 0.0535 }, { threshold: 31690, rate: 0.068 }, { threshold: 104090, rate: 0.0785 }, { threshold: 193240, rate: 0.0985 }], hasLocalTax: false, notes: "Top rate of 9.85% applies over $193,240." },
  MS: { code: "MS", name: "Mississippi", type: "flat", rate: 0.04, hasLocalTax: false, notes: "Flat rate of 4.0% on taxable income over $10,000." },
  MO: { code: "MO", name: "Missouri", type: "graduated", rate: 0.047, brackets: [{ threshold: 0, rate: 0.015 }, { threshold: 1207, rate: 0.02 }, { threshold: 2414, rate: 0.025 }, { threshold: 3621, rate: 0.03 }, { threshold: 4828, rate: 0.035 }, { threshold: 6035, rate: 0.04 }, { threshold: 7242, rate: 0.045 }, { threshold: 8449, rate: 0.047 }], hasLocalTax: true, notes: "Top rate of 4.7% plus St. Louis and Kansas City local taxes." },
  MT: { code: "MT", name: "Montana", type: "graduated", rate: 0.059, brackets: [{ threshold: 0, rate: 0.047 }, { threshold: 20500, rate: 0.059 }], hasLocalTax: false, notes: "Top rate of 5.9% based on federal taxable income." },
  NE: { code: "NE", name: "Nebraska", type: "graduated", rate: 0.052, brackets: [{ threshold: 0, rate: 0.0246 }, { threshold: 3700, rate: 0.0351 }, { threshold: 22160, rate: 0.0501 }, { threshold: 35730, rate: 0.052 }], hasLocalTax: false, notes: "Top rate scheduled at 5.2%." },
  NV: { code: "NV", name: "Nevada", type: "none", rate: 0, hasLocalTax: false, notes: "No state individual income tax." },
  NH: { code: "NH", name: "New Hampshire", type: "none", rate: 0, hasLocalTax: false, notes: "No state tax on earned wage or 1099 freelance income." },
  NJ: { code: "NJ", name: "New Jersey", type: "graduated", rate: 0.1075, brackets: [{ threshold: 0, rate: 0.014 }, { threshold: 20000, rate: 0.0175 }, { threshold: 35000, rate: 0.035 }, { threshold: 40000, rate: 0.05525 }, { threshold: 75000, rate: 0.0637 }, { threshold: 500000, rate: 0.0897 }, { threshold: 1000000, rate: 0.1075 }], hasLocalTax: false, notes: "Progressive rates up to 10.75% for income over $1,000,000." },
  NM: { code: "NM", name: "New Mexico", type: "graduated", rate: 0.059, brackets: [{ threshold: 0, rate: 0.017 }, { threshold: 5500, rate: 0.032 }, { threshold: 11000, rate: 0.047 }, { threshold: 16000, rate: 0.049 }, { threshold: 210000, rate: 0.059 }], hasLocalTax: false, notes: "Top rate of 5.9% applies over $210,000." },
  NY: { code: "NY", name: "New York", type: "graduated", rate: 0.109, brackets: [{ threshold: 0, rate: 0.04 }, { threshold: 8500, rate: 0.045 }, { threshold: 11700, rate: 0.0525 }, { threshold: 13900, rate: 0.055 }, { threshold: 80650, rate: 0.06 }, { threshold: 215400, rate: 0.0685 }, { threshold: 1077550, rate: 0.0965 }, { threshold: 5000000, rate: 0.103 }, { threshold: 25000000, rate: 0.109 }], hasLocalTax: true, notes: "Top rate of 10.9% plus NYC local tax (3.078% - 3.876%) for city residents." },
  NC: { code: "NC", name: "North Carolina", type: "flat", rate: 0.0425, hasLocalTax: false, notes: "Flat individual rate of 4.25%." },
  ND: { code: "ND", name: "North Dakota", type: "graduated", rate: 0.025, brackets: [{ threshold: 0, rate: 0.0 }, { threshold: 44725, rate: 0.0195 }, { threshold: 225975, rate: 0.025 }], hasLocalTax: false, notes: "Top marginal rate of 2.5%." },
  OH: { code: "OH", name: "Ohio", type: "graduated", rate: 0.035, brackets: [{ threshold: 0, rate: 0.0 }, { threshold: 26050, rate: 0.0275 }, { threshold: 100000, rate: 0.035 }], hasLocalTax: true, notes: "State top rate of 3.5% plus municipal income taxes." },
  OK: { code: "OK", name: "Oklahoma", type: "graduated", rate: 0.0475, brackets: [{ threshold: 0, rate: 0.0025 }, { threshold: 1000, rate: 0.0075 }, { threshold: 2500, rate: 0.0175 }, { threshold: 3750, rate: 0.0275 }, { threshold: 4900, rate: 0.0375 }, { threshold: 7200, rate: 0.0475 }], hasLocalTax: false, notes: "Top rate of 4.75% applies over $7,200." },
  OR: { code: "OR", name: "Oregon", type: "graduated", rate: 0.099, brackets: [{ threshold: 0, rate: 0.0475 }, { threshold: 4300, rate: 0.0675 }, { threshold: 10750, rate: 0.0875 }, { threshold: 125000, rate: 0.099 }], hasLocalTax: true, notes: "Top rate of 9.9% plus Portland metro supportive housing tax." },
  PA: { code: "PA", name: "Pennsylvania", type: "flat", rate: 0.0307, hasLocalTax: true, notes: "Constitutional flat rate of 3.07% plus local Earned Income Tax (EIT)." },
  RI: { code: "RI", name: "Rhode Island", type: "graduated", rate: 0.0599, brackets: [{ threshold: 0, rate: 0.0375 }, { threshold: 77450, rate: 0.0475 }, { threshold: 176050, rate: 0.0599 }], hasLocalTax: false, notes: "Top marginal rate 5.99% applies over $176,050." },
  SC: { code: "SC", name: "South Carolina", type: "graduated", rate: 0.062, brackets: [{ threshold: 0, rate: 0.0 }, { threshold: 3460, rate: 0.03 }, { threshold: 17330, rate: 0.062 }], hasLocalTax: false, notes: "Top rate of 6.2% applies over $17,330." },
  SD: { code: "SD", name: "South Dakota", type: "none", rate: 0, hasLocalTax: false, notes: "No state individual income tax." },
  TN: { code: "TN", name: "Tennessee", type: "none", rate: 0, hasLocalTax: false, notes: "No state individual income tax." },
  TX: { code: "TX", name: "Texas", type: "none", rate: 0, hasLocalTax: false, notes: "No state individual income tax." },
  UT: { code: "UT", name: "Utah", type: "flat", rate: 0.0455, hasLocalTax: false, notes: "Flat individual rate of 4.55%." },
  VT: { code: "VT", name: "Vermont", type: "graduated", rate: 0.0875, brackets: [{ threshold: 0, rate: 0.0335 }, { threshold: 45400, rate: 0.066 }, { threshold: 110050, rate: 0.076 }, { threshold: 229550, rate: 0.0875 }], hasLocalTax: false, notes: "Top rate of 8.75% applies over $229,550." },
  VA: { code: "VA", name: "Virginia", type: "graduated", rate: 0.0575, brackets: [{ threshold: 0, rate: 0.02 }, { threshold: 3000, rate: 0.03 }, { threshold: 5000, rate: 0.05 }, { threshold: 17000, rate: 0.0575 }], hasLocalTax: false, notes: "Top rate of 5.75% applies over $17,000." },
  WA: { code: "WA", name: "Washington", type: "none", rate: 0, hasLocalTax: false, notes: "No state individual earned income tax." },
  WV: { code: "WV", name: "West Virginia", type: "graduated", rate: 0.0482, brackets: [{ threshold: 0, rate: 0.0236 }, { threshold: 10000, rate: 0.0315 }, { threshold: 25000, rate: 0.0354 }, { threshold: 40000, rate: 0.0472 }, { threshold: 60000, rate: 0.0482 }], hasLocalTax: true, notes: "Top rate of 4.82% applies over $60,000." },
  WI: { code: "WI", name: "Wisconsin", type: "graduated", rate: 0.0765, brackets: [{ threshold: 0, rate: 0.035 }, { threshold: 14320, rate: 0.044 }, { threshold: 28640, rate: 0.053 }, { threshold: 315310, rate: 0.0765 }], hasLocalTax: false, notes: "Top rate of 7.65% applies over $315,310." },
  WY: { code: "WY", name: "Wyoming", type: "none", rate: 0, hasLocalTax: false, notes: "No state individual income tax." },
  DC: { code: "DC", name: "District of Columbia", type: "graduated", rate: 0.1075, brackets: [{ threshold: 0, rate: 0.04 }, { threshold: 10000, rate: 0.06 }, { threshold: 40000, rate: 0.065 }, { threshold: 60000, rate: 0.085 }, { threshold: 250000, rate: 0.0925 }, { threshold: 500000, rate: 0.0975 }, { threshold: 1000000, rate: 0.1075 }], hasLocalTax: false, notes: "Progressive rates from 4% to 10.75%." },
};

/**
 * Calculates estimated state income tax for a given state code and taxable income.
 */
export function calculateStateTax(stateCode: string, taxableIncome: number): { tax: number; effectiveRate: number; note: string } {
  const state = US_STATE_TAXES[stateCode.toUpperCase()] ?? US_STATE_TAXES.TX;
  if (state.type === "none" || taxableIncome <= 0) {
    return { tax: 0, effectiveRate: 0, note: state.notes };
  }

  if (state.type === "flat") {
    const tax = taxableIncome * state.rate;
    return { tax, effectiveRate: state.rate, note: state.notes };
  }

  if (state.brackets && state.brackets.length > 0) {
    let tax = 0;
    const sorted = [...state.brackets].sort((a, b) => a.threshold - b.threshold);
    for (let i = 0; i < sorted.length; i += 1) {
      const cur = sorted[i];
      const next = sorted[i + 1];
      if (taxableIncome > cur.threshold) {
        const taxableInBracket = next ? Math.min(taxableIncome, next.threshold) - cur.threshold : taxableIncome - cur.threshold;
        tax += taxableInBracket * cur.rate;
      }
    }
    const effectiveRate = taxableIncome > 0 ? tax / taxableIncome : 0;
    return { tax, effectiveRate, note: state.notes };
  }

  const tax = taxableIncome * state.rate;
  return { tax, effectiveRate: state.rate, note: state.notes };
}
