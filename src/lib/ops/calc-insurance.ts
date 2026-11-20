import type { CalcOp } from "./types";
import { extendedFinanceOps } from "./calc-finance-extended.ts";

function num(value: string, label: string, { min = -Infinity, max = Infinity, allowZero = true } = {}): number {
  const parsed = Number(String(value).replace(/,/g, "").trim());
  if (value.trim() === "" || !Number.isFinite(parsed)) throw new Error(`Enter a number for ${label}.`);
  if (parsed < min || parsed > max || (!allowZero && parsed === 0)) throw new Error(`${label} must be ${allowZero ? "at least" : "greater than"} ${min}.`);
  return parsed;
}

const usd = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD" });
const pct = (v: number) => `${v.toFixed(2)}%`;

export const ops: Record<string, CalcOp> = {
  // Existing extended ops
  "term-life-insurance-calculator": extendedFinanceOps["term-life-insurance-calculator"],
  "hsa-savings-calculator": extendedFinanceOps["hsa-savings-calculator"],
  "disability-insurance-needs": extendedFinanceOps["disability-insurance-needs"],

  "term-vs-whole-life": {
    fields: [
      { id: "coverageAmount", label: "Desired Death Benefit ($)", type: "number", default: "1000000" },
      { id: "termAnnualPremium", label: "20-Year Term Life Annual Premium ($)", type: "number", default: "650" },
      { id: "wholeLifeAnnualPremium", label: "Whole Life Annual Premium ($)", type: "number", default: "8500" },
      { id: "investmentReturnRate", label: "Estimated Market Investment Return (%)", type: "number", default: "7.5", step: "0.1" },
      { id: "years", label: "Time Horizon (Years)", type: "number", default: "20" }
    ],
    note: "Classic 'Buy Term and Invest the Difference' financial comparison.",
    compute(v) {
      const termPrem = num(v.termAnnualPremium, "Term Premium", { min: 50 });
      const wholePrem = num(v.wholeLifeAnnualPremium, "Whole Life Premium", { min: termPrem });
      const r = num(v.investmentReturnRate, "Return Rate", { min: 0 }) / 100;
      const yrs = num(v.years, "Years", { min: 1, max: 40 });
      const annualDifference = wholePrem - termPrem;
      // Future value of annual difference invested
      let investedWealth = 0;
      for (let i = 0; i < yrs; i++) {
        investedWealth = (investedWealth + annualDifference) * (1 + r);
      }
      return {
        results: [
          { label: "Invested Difference Wealth (Buying Term)", value: usd(investedWealth), primary: true },
          { label: "Annual Premium Saved with Term", value: usd(annualDifference) },
          { label: "Total Premiums Paid: Term Life", value: usd(termPrem * yrs) },
          { label: "Total Premiums Paid: Whole Life", value: usd(wholePrem * yrs) }
        ],
        formula: "Buy Term and Invest the Difference in Index Funds"
      };
    }
  },

  "auto-deductible-vs-premium": {
    fields: [
      { id: "premiumLowDeductible", label: "Annual Premium with $500 Deductible ($)", type: "number", default: "1650" },
      { id: "premiumHighDeductible", label: "Annual Premium with $1,000 Deductible ($)", type: "number", default: "1350" }
    ],
    note: "Calculates the claim-free years required to make choosing a higher collision deductible mathematically optimal.",
    compute(v) {
      const prem500 = num(v.premiumLowDeductible, "Low Deductible Premium", { min: 100 });
      const prem1000 = num(v.premiumHighDeductible, "High Deductible Premium", { min: 50 });
      if (prem1000 >= prem500) throw new Error("High deductible premium should be lower than low deductible premium.");
      const annualSavings = prem500 - prem1000;
      const deductibleRiskGap = 1000 - 500;
      const breakevenYears = deductibleRiskGap / annualSavings;
      return {
        results: [
          { label: "Claim-Free Breakeven Horizon", value: `${breakevenYears.toFixed(1)} years`, primary: true },
          { label: "Annual Premium Savings", value: usd(annualSavings) },
          { label: "Recommendation", value: breakevenYears <= 3 ? "Choose $1,000 Deductible (Fast savings)" : "Keep $500 Deductible" }
        ],
        formula: "Breakeven = (Deductible Gap $500) / Annual Premium Savings"
      };
    }
  },

  "homeowners-replacement-cost": {
    fields: [
      { id: "livingAreaSqFt", label: "Total Home Finished Living Area (Sq Ft)", type: "number", default: "2400" },
      { id: "rebuildCostPerSqFt", label: "Local Construction Rebuild Cost / Sq Ft ($) (US avg $150 - $300)", type: "number", default: "210" },
      { id: "garageSqFt", label: "Garage Area (Sq Ft)", type: "number", default: "480" },
      { id: "debrisRemovalBuffer", label: "Debris Removal & Building Code Upgrade Buffer (%)", type: "number", default: "15", step: "1" }
    ],
    note: "Replacement cost differs significantly from market real estate value because land is not destroyed in a loss.",
    compute(v) {
      const sqft = num(v.livingAreaSqFt, "Living Area", { min: 100 });
      const costPerSqFt = num(v.rebuildCostPerSqFt, "Cost / SqFt", { min: 50 });
      const garage = num(v.garageSqFt, "Garage SqFt", { min: 0 });
      const buffer = num(v.debrisRemovalBuffer, "Buffer %", { min: 0, max: 50 }) / 100;
      const mainHouseCost = sqft * costPerSqFt;
      const garageCost = garage * (costPerSqFt * 0.5); // garage rebuild is ~50%
      const subtotal = mainHouseCost + garageCost;
      const recommendedDwellingCoverage = subtotal * (1 + buffer);
      return {
        results: [
          { label: "Recommended Dwelling Coverage (Coverage A)", value: usd(recommendedDwellingCoverage), primary: true },
          { label: "Base Structure Rebuild Cost", value: usd(subtotal) },
          { label: "Code Upgrade & Debris Buffer", value: usd(subtotal * buffer) }
        ],
        formula: "Coverage A = (Living Area × $/SqFt + Garage) × (1 + Buffer %)"
      };
    }
  },

  "umbrella-insurance-need": {
    fields: [
      { id: "homeEquity", label: "Total Home Equity ($)", type: "number", default: "350000" },
      { id: "investmentsAndSavings", label: "Taxable Savings, Brokerage & Crypto ($)", type: "number", default: "450000" },
      { id: "annualIncome", label: "Annual Household Gross Income ($)", type: "number", default: "175000" },
      { id: "autoLiabilityLimits", label: "Current Auto Policy Bodily Injury Limit ($)", type: "number", default: "500000" }
    ],
    note: "Umbrella liability insurance protects your accumulated net worth and future wage garnishment beyond base policy limits.",
    compute(v) {
      const equity = num(v.homeEquity, "Home Equity", { min: 0 });
      const inv = num(v.investmentsAndSavings, "Investments", { min: 0 });
      const income = num(v.annualIncome, "Income", { min: 0 });
      const autoLimit = num(v.autoLiabilityLimits, "Auto Limit", { min: 100000 });
      const netWorthAtRisk = equity + inv + (income * 2); // 2 years future income vulnerability
      const suggestedUmbrella = Math.max(1000000, Math.ceil(netWorthAtRisk / 1000000) * 1000000);
      return {
        results: [
          { label: "Recommended Umbrella Policy Limit", value: usd(suggestedUmbrella), primary: true },
          { label: "Total Assets & Income at Risk", value: usd(netWorthAtRisk) },
          { label: "Coverage Gap Above Auto Limit", value: usd(Math.max(0, netWorthAtRisk - autoLimit)) }
        ],
        formula: "Suggested Policy = Net Worth + (2 × Annual Income) rounded up to nearest $1M"
      };
    }
  },

  "pet-insurance-roi": {
    fields: [
      { id: "monthlyPremium", label: "Pet Insurance Monthly Premium ($)", type: "number", default: "48" },
      { id: "annualDeductible", label: "Annual Deductible ($)", type: "number", default: "250" },
      { id: "reimbursementRate", label: "Reimbursement Rate (%) (e.g. 80% or 90%)", type: "number", default: "80", step: "5" },
      { id: "vetBills", label: "Estimated Annual Vet & Emergency Care Bills ($)", type: "number", default: "1800" }
    ],
    note: "Evaluates annual out-of-pocket veterinary costs with and without pet accident/illness insurance.",
    compute(v) {
      const prem = num(v.monthlyPremium, "Premium", { min: 5 });
      const ded = num(v.annualDeductible, "Deductible", { min: 0 });
      const rate = num(v.reimbursementRate, "Reimbursement %", { min: 50, max: 100 }) / 100;
      const vet = num(v.vetBills, "Vet Bills", { min: 0 });
      const annualPremium = prem * 12;
      const coveredAmount = Math.max(0, vet - ded);
      const insurancePayout = coveredAmount * rate;
      const outOfPocketWithIns = annualPremium + (vet - insurancePayout);
      const netDifference = vet - outOfPocketWithIns;
      return {
        results: [
          { label: "Insurance Benefit / Net Savings", value: `${netDifference >= 0 ? "+" : ""}${usd(netDifference)}`, primary: true },
          { label: "Insurance Reimbursement Payout", value: usd(insurancePayout) },
          { label: "Total Cost With Insurance (Prem + Share)", value: usd(outOfPocketWithIns) },
          { label: "Total Cost Without Insurance", value: usd(vet) }
        ],
        formula: "Payout = (Vet Bills - Deductible) × Reimbursement %"
      };
    }
  },

  "renters-insurance-coverage": {
    fields: [
      { id: "electronicsAppliances", label: "Computers, TVs, Phones & Appliances ($)", type: "number", default: "8500" },
      { id: "furnitureDecor", label: "Furniture, Beds & Home Goods ($)", type: "number", default: "12000" },
      { id: "clothingJewelry", label: "Clothing, Shoes & Jewelry ($)", type: "number", default: "9500" },
      { id: "sportsOther", label: "Bikes, Gear & Miscellaneous Possessions ($)", type: "number", default: "4000" }
    ],
    note: "Calculates the appropriate personal property coverage (Coverage C) for apartment or home renters.",
    compute(v) {
      const e = num(v.electronicsAppliances, "Electronics", { min: 0 });
      const f = num(v.furnitureDecor, "Furniture", { min: 0 });
      const c = num(v.clothingJewelry, "Clothing", { min: 0 });
      const o = num(v.sportsOther, "Other", { min: 0 });
      const totalProperty = e + f + c + o;
      const roundedCoverage = Math.ceil(totalProperty / 5000) * 5000;
      return {
        results: [
          { label: "Recommended Personal Property Coverage", value: usd(roundedCoverage), primary: true },
          { label: "Calculated Possessions Inventory Value", value: usd(totalProperty) },
          { label: "Standard Liability Minimum", value: "$100,000 - $300,000" }
        ],
        formula: "Personal Property = Sum of all personal possessions replacement value"
      };
    }
  },

  "long-term-care-need": {
    fields: [
      { id: "currentAge", label: "Current Age", type: "number", default: "55" },
      { id: "monthlyCareCost", label: "Monthly Nursing Home / Assisted Living Cost ($)", type: "number", default: "6500" },
      { id: "expectedYearsOfCare", label: "Expected Duration of Care (Years) (US avg 3 yrs)", type: "number", default: "3" },
      { id: "dailyBenefitTarget", label: "Desired Daily Benefit Cap ($)", type: "number", default: "220" }
    ],
    note: "Underwriting guidelines suggest purchasing LTC insurance between ages 50 and 65 for optimal underwriting health qualifications.",
    compute(v) {
      num(v.currentAge, "Age", { min: 30, max: 85 });
      const careCost = num(v.monthlyCareCost, "Care Cost", { min: 1000 });
      const yrs = num(v.expectedYearsOfCare, "Years", { min: 1 });
      const dailyCap = num(v.dailyBenefitTarget, "Daily Cap", { min: 50 });
      const totalCareCost = careCost * 12 * yrs;
      const totalPolicyPool = dailyCap * 365 * yrs;
      return {
        results: [
          { label: "Estimated Lifetime Care Obligation", value: usd(totalCareCost), primary: true },
          { label: "Total Lifetime Insurance Pool", value: usd(totalPolicyPool) },
          { label: "Annual Care Expense", value: usd(careCost * 12) }
        ],
        formula: "Total Need = Monthly Care Cost × 12 × Expected Duration"
      };
    }
  },

  "health-copay-vs-coinsurance": {
    fields: [
      { id: "hsaDeductible", label: "HDHP / HSA Annual Deductible ($)", type: "number", default: "3500" },
      { id: "hsaAnnualPremium", label: "HDHP Annual Employee Premium ($)", type: "number", default: "1800" },
      { id: "ppoDeductible", label: "PPO Plan Annual Deductible ($)", type: "number", default: "1000" },
      { id: "ppoAnnualPremium", label: "PPO Annual Employee Premium ($)", type: "number", default: "3900" },
      { id: "estimatedMedicalSpend", label: "Expected Annual Healthcare Expenses ($)", type: "number", default: "2800" }
    ],
    note: "Compares Total Annual Financial Exposure between High-Deductible Health Plans (HDHP) and low-deductible PPO plans.",
    compute(v) {
      const hsaDed = num(v.hsaDeductible, "HDHP Deductible", { min: 0 });
      const hsaPrem = num(v.hsaAnnualPremium, "HDHP Premium", { min: 0 });
      const ppoDed = num(v.ppoDeductible, "PPO Deductible", { min: 0 });
      const ppoPrem = num(v.ppoAnnualPremium, "PPO Premium", { min: 0 });
      const spend = num(v.estimatedMedicalSpend, "Medical Spend", { min: 0 });

      // Out of pocket HDHP
      const hsaOop = hsaPrem + Math.min(spend, hsaDed);
      // Out of pocket PPO (assuming 20% coinsurance after deductible)
      const ppoCovered = Math.max(0, spend - ppoDed);
      const ppoOop = ppoPrem + Math.min(spend, ppoDed) + (ppoCovered * 0.20);
      const savings = ppoOop - hsaOop;
      return {
        results: [
          { label: "Financial Winner for Scenario", value: savings >= 0 ? `HDHP saves ${usd(savings)}` : `PPO saves ${usd(Math.abs(savings))}`, primary: true },
          { label: "Total Out-of-Pocket: HDHP", value: usd(hsaOop) },
          { label: "Total Out-of-Pocket: PPO", value: usd(ppoOop) },
          { label: "Premium Cost Advantage (HDHP)", value: `${usd(ppoPrem - hsaPrem)} saved upfront` }
        ],
        formula: "Total Exposure = Annual Premium + Out-of-Pocket Medical Claims"
      };
    }
  },

  "annuity-payout-estimator": {
    fields: [
      { id: "premiumAmount", label: "Single Lump-Sum Premium Invested ($)", type: "number", default: "250000" },
      { id: "ageAtPurchase", label: "Annuitant Age at Start of Payouts", type: "number", default: "65" },
      { id: "guaranteedRate", label: "Annuity Payout Rate (%) (Typical 6% - 8% based on age)", type: "number", default: "7.1", step: "0.1" }
    ],
    note: "Single Premium Immediate Annuity (SPIA) guaranteed lifetime monthly income estimator.",
    compute(v) {
      const premium = num(v.premiumAmount, "Premium", { min: 10000 });
      const rate = num(v.guaranteedRate, "Payout Rate %", { min: 1 }) / 100;
      const annualPayout = premium * rate;
      const monthlyIncome = annualPayout / 12;
      return {
        results: [
          { label: "Guaranteed Monthly Income", value: usd(monthlyIncome), primary: true },
          { label: "Guaranteed Annual Payout", value: usd(annualPayout) },
          { label: "Cumulative 20-Year Payout", value: usd(annualPayout * 20) }
        ],
        formula: "Monthly Payout = (Premium × Guaranteed Annual Payout Rate %) / 12"
      };
    }
  },

  "general-liability-estimator": {
    fields: [
      { id: "annualRevenue", label: "Annual Business Gross Revenue ($)", type: "number", default: "750000" },
      { id: "employeeCount", label: "Number of Full-Time Employees", type: "number", default: "6" }
    ],
    note: "Commercial General Liability (CGL) coverage sizing for bodily injury, property damage, and slip-and-fall claims.",
    compute(v) {
      const rev = num(v.annualRevenue, "Revenue", { min: 10000 });
      const emps = num(v.employeeCount, "Employees", { min: 1 });
      const perOccurrence = rev > 1000000 || emps > 10 ? 2000000 : 1000000;
      const aggregateLimit = perOccurrence * 2;
      const estimatedAnnualPremium = Math.max(500, Math.round((rev * 0.002) + (emps * 150)));
      return {
        results: [
          { label: "Recommended Per-Occurrence Limit", value: usd(perOccurrence), primary: true },
          { label: "Recommended General Aggregate Limit", value: usd(aggregateLimit) },
          { label: "Estimated Baseline Annual Premium", value: usd(estimatedAnnualPremium) }
        ],
        formula: "Standard Commercial Underwriting Scale"
      };
    }
  },

  "business-interruption-calculator": {
    fields: [
      { id: "projectedMonthlyRevenue", label: "Average Monthly Gross Revenue ($)", type: "number", default: "60000" },
      { id: "variableOperatingExpenses", label: "Discontinued Costs during Shutdown ($) (Raw goods/shipping)", type: "number", default: "22000" },
      { id: "continuingExpenses", label: "Continuing Fixed Costs ($) (Key payroll, rent, loan interest)", type: "number", default: "25000" },
      { id: "interruptionMonths", label: "Estimated Restoration Period (Months)", type: "number", default: "4" }
    ],
    note: "Business Interruption coverage replaces lost net profit and continuing fixed operating expenses during physical disaster repair.",
    compute(v) {
      const rev = num(v.projectedMonthlyRevenue, "Revenue", { min: 1000 });
      const varExp = num(v.variableOperatingExpenses, "Discontinued Costs", { min: 0 });
      const contExp = num(v.continuingExpenses, "Continuing Costs", { min: 0 });
      const months = num(v.interruptionMonths, "Months", { min: 1 });
      const monthlyNetProfit = rev - varExp - contExp;
      const monthlyClaim = monthlyNetProfit + contExp;
      const totalCoverageNeeded = monthlyClaim * months;
      return {
        results: [
          { label: "Total Business Interruption Claim Value", value: usd(totalCoverageNeeded), primary: true },
          { label: "Monthly Covered Business Income", value: usd(monthlyClaim) },
          { label: "Continuing Fixed Payroll & Rent", value: usd(contExp * months) }
        ],
        formula: "Claim Value = (Lost Net Profit + Continuing Fixed Costs) × Interruption Months"
      };
    }
  },

  "disability-income-need": {
    fields: [
      { id: "takeHomePay", label: "Current After-Tax Monthly Income ($)", type: "number", default: "6800" },
      { id: "fixedMonthlyExpenses", label: "Essential Monthly Household Expenses ($)", type: "number", default: "4900" },
      { id: "existingEmployerBenefit", label: "Employer Group Long-Term Disability Monthly Payout ($)", type: "number", default: "2500" }
    ],
    note: "Calculates the individual disability income coverage gap required to avoid lifestyle insolvency.",
    compute(v) {
      const takeHome = num(v.takeHomePay, "Take-Home Pay", { min: 1000 });
      const exp = num(v.fixedMonthlyExpenses, "Expenses", { min: 500 });
      const employerBen = num(v.existingEmployerBenefit, "Employer Benefit", { min: 0 });
      const monthlyShortfall = Math.max(0, exp - employerBen);
      return {
        results: [
          { label: "Monthly Disability Income Gap", value: usd(monthlyShortfall), primary: true },
          { label: "Total Coverage Needed (to match expenses)", value: usd(exp) },
          { label: "Income Protection Ratio", value: pct((employerBen / takeHome) * 100) }
        ],
        formula: "Coverage Gap = Essential Monthly Expenses - Existing Benefits"
      };
    }
  },

  "key-person-insurance-value": {
    fields: [
      { id: "annualSalary", label: "Key Executive / Founder Annual Compensation ($)", type: "number", default: "185000" },
      { id: "recruitmentReplacementCost", label: "Executive Search & Signing Bonus Cost ($)", type: "number", default: "65000" },
      { id: "lostProfitContribution", label: "Annual Direct Gross Profit Attributable to Executive ($)", type: "number", default: "350000" },
      { id: "rampYears", label: "Years for Successor to Reach Full Productivity", type: "number", default: "2" }
    ],
    note: "Key Person Life & Disability insurance protects business solvency against the death or incapacitation of critical leaders.",
    compute(v) {
      const salary = num(v.annualSalary, "Salary", { min: 10000 });
      const recruit = num(v.recruitmentReplacementCost, "Recruitment", { min: 0 });
      const profit = num(v.lostProfitContribution, "Profit Contribution", { min: 0 });
      const ramp = num(v.rampYears, "Ramp Years", { min: 1 });
      const totalLostProfit = profit * ramp;
      const recommendedPolicy = recruit + totalLostProfit + salary;
      return {
        results: [
          { label: "Recommended Key Person Policy Size", value: usd(recommendedPolicy), primary: true },
          { label: "Lost Attributable Business Profit", value: usd(totalLostProfit) },
          { label: "Executive Search & Transition Overhead", value: usd(recruit) }
        ],
        formula: "Policy = Recruitment Costs + (Annual Lost Profit × Ramp Years) + 1-Year Salary Buffer"
      };
    }
  },

  "travel-insurance-coverage": {
    fields: [
      { id: "tripCost", label: "Total Prepaid Non-Refundable Trip Cost ($)", type: "number", default: "6500" },
      { id: "destination", label: "Destination Region", type: "select", default: "international", choices: [["domestic", "Domestic / Local ($50k Medical)"], ["international", "International / Remote ($100k-$250k Medical)"]] }
    ],
    note: "Recommends Trip Cancellation and Emergency Medical Evacuation coverage minimums.",
    compute(v) {
      const cost = num(v.tripCost, "Trip Cost", { min: 100 });
      const isIntl = v.destination === "international";
      const medCoverage = isIntl ? 250000 : 50000;
      const evacCoverage = isIntl ? 500000 : 100000;
      const estimatedPolicyCost = Math.round(cost * (isIntl ? 0.07 : 0.05));
      return {
        results: [
          { label: "Trip Cancellation Coverage Limit", value: usd(cost), primary: true },
          { label: "Emergency Medical Coverage", value: usd(medCoverage) },
          { label: "Emergency Medical Evacuation", value: usd(evacCoverage) },
          { label: "Estimated Premium Cost (5-8% of trip)", value: usd(estimatedPolicyCost) }
        ],
        formula: "Cancellation = 100% Non-Refundable Sunk Costs"
      };
    }
  },

  "flood-insurance-risk-estimator": {
    fields: [
      { id: "homeReplacementValue", label: "Home Replacement Value (Structure) ($)", type: "number", default: "350000" },
      { id: "personalContentsValue", label: "Personal Contents Value ($)", type: "number", default: "100000" }
    ],
    note: "National Flood Insurance Program (NFIP) statutory limits are capped at $250,000 for residential building and $100,000 for contents.",
    compute(v) {
      const home = num(v.homeReplacementValue, "Home Value", { min: 10000 });
      const contents = num(v.personalContentsValue, "Contents", { min: 5000 });
      const nfipBuildingMax = 250000;
      const nfipContentsMax = 100000;
      const buildingGap = Math.max(0, home - nfipBuildingMax);
      const contentsGap = Math.max(0, contents - nfipContentsMax);
      return {
        results: [
          { label: "Max NFIP Building Coverage", value: usd(Math.min(home, nfipBuildingMax)), primary: true },
          { label: "Excess Private Flood Insurance Need", value: buildingGap > 0 ? usd(buildingGap) : "None (NFIP Covers Structure)" },
          { label: "Max NFIP Contents Coverage", value: usd(Math.min(contents, nfipContentsMax)) },
          { label: "Excess Private Contents Need", value: contentsGap > 0 ? usd(contentsGap) : "None (NFIP Covers Contents)" }
        ],
        formula: "NFIP Statutory Cap: $250k Residential Building + $100k Contents"
      };
    }
  }
};
