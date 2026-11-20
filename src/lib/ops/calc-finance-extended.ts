import type { CalcOp } from "./types";

function num(value: string, label: string, { min = -Infinity, allowZero = true } = {}): number {
  const parsed = Number(String(value).replace(/,/g, "").trim());
  if (value.trim() === "" || !Number.isFinite(parsed)) throw new Error(`Enter a number for ${label}.`);
  if (parsed < min || (!allowZero && parsed === 0)) throw new Error(`${label} must be ${allowZero ? "at least" : "greater than"} ${min}.`);
  return parsed;
}

const usd = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });
const pct = (value: number) => `${value.toFixed(2)}%`;

export const extendedFinanceOps: Record<string, CalcOp> = {
  // --- Real Estate Suite ---
  "fha-loan-calculator": {
    fields: [
      { id: "homePrice", label: "Home Purchase Price (USD)", type: "number", default: "350000" },
      { id: "downPercent", label: "Down Payment % (Min 3.5%)", type: "number", default: "3.5", step: "0.1" },
      { id: "rate", label: "Interest Rate (%)", type: "number", default: "6.5", step: "0.01" },
      { id: "termYears", label: "Loan Term (Years)", type: "number", default: "30" }
    ],
    note: "Includes standard upfront FHA mortgage insurance premium (1.75%) and annual MIP (0.55%).",
    compute(v) {
      const price = num(v.homePrice, "Home Price", { min: 1000 });
      const dp = num(v.downPercent, "Down Payment %", { min: 3.5 }) / 100;
      const rate = num(v.rate, "Interest Rate", { min: 0 }) / 100 / 12;
      const n = num(v.termYears, "Term", { min: 1 }) * 12;
      const baseLoan = price * (1 - dp);
      const upfrontMip = baseLoan * 0.0175;
      const totalLoan = baseLoan + upfrontMip;
      const pi = (totalLoan * (rate * Math.pow(1 + rate, n))) / (Math.pow(1 + rate, n) - 1);
      const monthlyMip = (baseLoan * 0.0055) / 12;
      const totalMonthly = pi + monthlyMip;
      return {
        results: [
          { label: "Total Monthly Payment (P&I + MIP)", value: usd(totalMonthly), primary: true },
          { label: "Principal & Interest", value: usd(pi) },
          { label: "Monthly FHA MIP", value: usd(monthlyMip) },
          { label: "Upfront MIP Financed", value: usd(upfrontMip) },
          { label: "Total Loan Amount", value: usd(totalLoan) }
        ],
        formula: "P = L[c(1+c)^n]/[(1+c)^n - 1] + Monthly MIP"
      };
    }
  },

  "va-loan-calculator": {
    fields: [
      { id: "homePrice", label: "Home Purchase Price (USD)", type: "number", default: "400000" },
      { id: "downPercent", label: "Down Payment % (0% for VA)", type: "number", default: "0", step: "1" },
      { id: "rate", label: "Interest Rate (%)", type: "number", default: "6.25", step: "0.01" },
      { id: "fundingFeePercent", label: "VA Funding Fee %", type: "number", default: "2.15", step: "0.05" }
    ],
    note: "VA loans feature 0% down and zero monthly private mortgage insurance (PMI).",
    compute(v) {
      const price = num(v.homePrice, "Home Price", { min: 1000 });
      const dp = num(v.downPercent, "Down Payment %", { min: 0 }) / 100;
      const rate = num(v.rate, "Interest Rate", { min: 0 }) / 100 / 12;
      const feePct = num(v.fundingFeePercent, "Funding Fee %", { min: 0 }) / 100;
      const n = 360;
      const baseLoan = price * (1 - dp);
      const fundingFee = baseLoan * feePct;
      const totalLoan = baseLoan + fundingFee;
      const monthly = (totalLoan * (rate * Math.pow(1 + rate, n))) / (Math.pow(1 + rate, n) - 1);
      return {
        results: [
          { label: "Monthly Payment (Zero PMI)", value: usd(monthly), primary: true },
          { label: "VA Funding Fee Financed", value: usd(fundingFee) },
          { label: "Total Financed Loan", value: usd(totalLoan) }
        ],
        formula: "P = Total Loan × [r(1+r)^n] / [(1+r)^n - 1]"
      };
    }
  },

  "heloc-payment-calculator": {
    fields: [
      { id: "creditLine", label: "Total Line of Credit (USD)", type: "number", default: "75000" },
      { id: "drawnAmount", label: "Amount Currently Drawn (USD)", type: "number", default: "40000" },
      { id: "rate", label: "Interest Rate (%)", type: "number", default: "8.5", step: "0.1" },
      { id: "phase", label: "Repayment Phase", type: "select", default: "draw", choices: [["draw", "Draw Period (Interest Only)"], ["repay", "Repayment Period (Principal + Interest)"]] }
    ],
    note: "Models both the 10-year interest-only draw period and the 20-year principal-amortization repayment phase.",
    compute(v) {
      const balance = num(v.drawnAmount, "Drawn Amount", { min: 0 });
      const rate = num(v.rate, "Interest Rate", { min: 0 }) / 100 / 12;
      const isDraw = v.phase === "draw";
      let payment = 0;
      if (isDraw) {
        payment = balance * rate;
      } else {
        const n = 240; // 20 years
        payment = (balance * (rate * Math.pow(1 + rate, n))) / (Math.pow(1 + rate, n) - 1);
      }
      return {
        results: [
          { label: isDraw ? "Interest-Only Monthly Payment" : "Amortized Monthly Payment", value: usd(payment), primary: true },
          { label: "Annual Interest Cost", value: usd(balance * (rate * 12)) },
          { label: "Remaining Available Line", value: usd(Math.max(0, num(v.creditLine, "Line") - balance)) }
        ],
        formula: isDraw ? "Payment = Drawn Balance × Monthly Interest" : "Standard 240-Month Amortization"
      };
    }
  },

  "commercial-cap-rate-calculator": {
    fields: [
      { id: "noi", label: "Net Operating Income - NOI (USD/Year)", type: "number", default: "84000" },
      { id: "propertyValue", label: "Purchase Price / Current Market Value (USD)", type: "number", default: "1200000" }
    ],
    note: "Capitalization rate evaluates commercial real estate return regardless of debt financing.",
    compute(v) {
      const noi = num(v.noi, "NOI", { min: 0 });
      const val = num(v.propertyValue, "Property Value", { min: 1000 });
      const capRate = (noi / val) * 100;
      return {
        results: [
          { label: "Capitalization Rate (Cap Rate)", value: pct(capRate), primary: true },
          { label: "Annual Net Operating Income", value: usd(noi) },
          { label: "Monthly Net Operating Income", value: usd(noi / 12) }
        ],
        formula: "Cap Rate = (Net Operating Income / Current Market Value) × 100%"
      };
    }
  },

  "gross-rent-multiplier-calculator": {
    fields: [
      { id: "price", label: "Property Purchase Price (USD)", type: "number", default: "450000" },
      { id: "grossRent", label: "Gross Annual Rental Income (USD)", type: "number", default: "54000" }
    ],
    note: "GRM measures the number of years for rental revenue to equal the property purchase price.",
    compute(v) {
      const price = num(v.price, "Price", { min: 1000 });
      const rent = num(v.grossRent, "Gross Rent", { min: 100 });
      const grm = price / rent;
      return {
        results: [
          { label: "Gross Rent Multiplier (GRM)", value: `${grm.toFixed(2)} years`, primary: true },
          { label: "Monthly Gross Rent", value: usd(rent / 12) }
        ],
        formula: "GRM = Property Price / Gross Annual Rent"
      };
    }
  },

  "cash-on-cash-return-calculator": {
    fields: [
      { id: "annualCashFlow", label: "Annual Pre-Tax Cash Flow (USD)", type: "number", default: "9600" },
      { id: "totalCashInvested", label: "Total Cash Invested (Down Payment + Closing + Rehab)", type: "number", default: "80000" }
    ],
    note: "Evaluates the cash income earned on the literal cash invested into a rental property.",
    compute(v) {
      const flow = num(v.annualCashFlow, "Cash Flow");
      const invested = num(v.totalCashInvested, "Cash Invested", { min: 100 });
      const coc = (flow / invested) * 100;
      return {
        results: [
          { label: "Cash-on-Cash Return", value: pct(coc), primary: true },
          { label: "Monthly Cash Flow", value: usd(flow / 12) }
        ],
        formula: "CoC = (Annual Pre-Tax Cash Flow / Total Cash Invested) × 100%"
      };
    }
  },

  "closing-costs-estimator": {
    fields: [
      { id: "loanAmount", label: "Mortgage Loan Amount (USD)", type: "number", default: "320000" },
      { id: "costPercent", label: "Estimated Closing Cost % (Typically 2% - 5%)", type: "number", default: "3.0", step: "0.1" }
    ],
    note: "Covers lender origination fees, appraisal, title search, insurance, and transfer taxes.",
    compute(v) {
      const loan = num(v.loanAmount, "Loan Amount", { min: 1000 });
      const pctVal = num(v.costPercent, "Cost %", { min: 0 }) / 100;
      const totalCost = loan * pctVal;
      return {
        results: [
          { label: "Estimated Total Closing Costs", value: usd(totalCost), primary: true },
          { label: "Low Estimate (2%)", value: usd(loan * 0.02) },
          { label: "High Estimate (5%)", value: usd(loan * 0.05) }
        ],
        formula: "Closing Costs = Loan Amount × Closing Cost Percentage"
      };
    }
  },

  // --- Insurance Suite ---
  "term-life-insurance-calculator": {
    fields: [
      { id: "income", label: "Annual Income to Replace (USD)", type: "number", default: "95000" },
      { id: "years", label: "Years of Income Replacement Needed", type: "number", default: "15" },
      { id: "debts", label: "Mortgage & Outstanding Debts (USD)", type: "number", default: "280000" },
      { id: "education", label: "Future Children College Fund (USD)", type: "number", default: "100000" },
      { id: "savings", label: "Existing Liquid Assets & Savings (USD)", type: "number", default: "50000" }
    ],
    note: "Uses standard capital needs analysis (Income Replacement + Debts + Education - Liquid Assets).",
    compute(v) {
      const inc = num(v.income, "Annual Income", { min: 0 });
      const yrs = num(v.years, "Years", { min: 1 });
      const debts = num(v.debts, "Debts", { min: 0 });
      const edu = num(v.education, "Education", { min: 0 });
      const sav = num(v.savings, "Savings", { min: 0 });
      const totalNeed = Math.max(0, (inc * yrs) + debts + edu - sav);
      return {
        results: [
          { label: "Recommended Term Life Coverage", value: usd(totalNeed), primary: true },
          { label: "Total Income Replacement", value: usd(inc * yrs) },
          { label: "Debt & Liability Obligation", value: usd(debts) },
          { label: "Net Liquid Assets Deducted", value: usd(-sav) }
        ],
        formula: "Coverage = (Income × Years) + Debts + Education - Savings"
      };
    }
  },

  "hsa-savings-calculator": {
    fields: [
      { id: "annualContrib", label: "Annual HSA Contribution (Max $4,300 single / $8,550 family)", type: "number", default: "4300" },
      { id: "taxRate", label: "Marginal Income Tax Bracket %", type: "number", default: "24" },
      { id: "returnRate", label: "Expected Annual Investment Growth %", type: "number", default: "7", step: "0.1" },
      { id: "years", label: "Years Until Retirement", type: "number", default: "20" }
    ],
    note: "Highlights the triple-tax advantage of Health Savings Accounts (tax-deductible, tax-free growth, tax-free withdrawal).",
    compute(v) {
      const c = num(v.annualContrib, "Contribution", { min: 0 });
      const taxRate = num(v.taxRate, "Tax Rate", { min: 0 }) / 100;
      const r = num(v.returnRate, "Return Rate", { min: 0 }) / 100;
      const yrs = num(v.years, "Years", { min: 1 });
      const annualTaxSavings = c * (taxRate + 0.0765); // Income tax + FICA
      let futureValue = 0;
      for (let y = 1; y <= yrs; y++) {
        futureValue = (futureValue + c) * (1 + r);
      }
      return {
        results: [
          { label: "Estimated HSA Balance at Retirement", value: usd(futureValue), primary: true },
          { label: "Annual Income & FICA Tax Savings", value: usd(annualTaxSavings) },
          { label: "Lifetime Tax Savings", value: usd(annualTaxSavings * yrs) }
        ],
        formula: "FV = Σ [Annual Contribution × (1 + r)^y]"
      };
    }
  },

  "disability-insurance-needs": {
    fields: [
      { id: "monthlyExpenses", label: "Essential Monthly Living Expenses (USD)", type: "number", default: "4500" },
      { id: "existingBenefit", label: "Existing Group LTD Monthly Benefit (USD)", type: "number", default: "2000" },
      { id: "otherIncome", label: "Spouse / Passive Monthly Income (USD)", type: "number", default: "1000" }
    ],
    note: "Determines the monthly income shortfall if unable to work due to accident or illness.",
    compute(v) {
      const exp = num(v.monthlyExpenses, "Expenses", { min: 0 });
      const ltd = num(v.existingBenefit, "LTD Benefit", { min: 0 });
      const other = num(v.otherIncome, "Other Income", { min: 0 });
      const shortfall = Math.max(0, exp - ltd - other);
      return {
        results: [
          { label: "Monthly Individual Disability Need", value: usd(shortfall), primary: true },
          { label: "Annual Income Protection Gap", value: usd(shortfall * 12) }
        ],
        formula: "Need = Monthly Expenses - Group LTD - Passive Income"
      };
    }
  },

  // --- Business & SaaS Suite ---
  "s-corp-tax-savings": {
    fields: [
      { id: "netProfit", label: "Annual Business Net Profit (USD)", type: "number", default: "150000" },
      { id: "reasonableSalary", label: "Reasonable W-2 Officer Salary (USD)", type: "number", default: "75000" },
      { id: "scorpAdminCost", label: "Annual S-Corp Payroll & Tax Prep Cost (USD)", type: "number", default: "2000" }
    ],
    note: "Calculates Medicare (2.9%) and Social Security (12.4%) self-employment tax saved on S-Corp shareholder distributions.",
    compute(v) {
      const profit = num(v.netProfit, "Profit", { min: 1000 });
      const salary = num(v.reasonableSalary, "Salary", { min: 1000 });
      const admin = num(v.scorpAdminCost, "Admin Cost", { min: 0 });
      const distribution = Math.max(0, profit - salary);
      const seTaxSavings = distribution * 0.153;
      const netSavings = seTaxSavings - admin;
      return {
        results: [
          { label: "Net Annual S-Corp Tax Savings", value: usd(Math.max(0, netSavings)), primary: true },
          { label: "Self-Employment Tax Saved", value: usd(seTaxSavings) },
          { label: "Shareholder Distribution (Tax-Free of SE)", value: usd(distribution) },
          { label: "Corporate Admin & Payroll Fees", value: usd(-admin) }
        ],
        formula: "Net Savings = (Distribution × 15.3% FICA) - Annual S-Corp Overhead"
      };
    }
  },

  "inventory-turnover-calculator": {
    fields: [
      { id: "cogs", label: "Cost of Goods Sold - COGS (USD/Year)", type: "number", default: "420000" },
      { id: "avgInventory", label: "Average Inventory Value (USD)", type: "number", default: "70000" }
    ],
    note: "Measures how many times inventory is sold and replaced over a year.",
    compute(v) {
      const cogs = num(v.cogs, "COGS", { min: 0 });
      const inv = num(v.avgInventory, "Average Inventory", { min: 1 });
      const turns = cogs / inv;
      const days = turns > 0 ? 365 / turns : 0;
      return {
        results: [
          { label: "Inventory Turnover Ratio", value: `${turns.toFixed(2)}x / year`, primary: true },
          { label: "Days Sales of Inventory (DSI)", value: `${days.toFixed(1)} days` }
        ],
        formula: "Turns = COGS / Average Inventory | DSI = 365 / Turns"
      };
    }
  },

  "working-capital-ratio-calculator": {
    fields: [
      { id: "currentAssets", label: "Total Current Assets (USD)", type: "number", default: "250000" },
      { id: "currentLiabilities", label: "Total Current Liabilities (USD)", type: "number", default: "140000" }
    ],
    note: "Evaluates short-term liquidity and ability to meet financial obligations.",
    compute(v) {
      const a = num(v.currentAssets, "Current Assets", { min: 0 });
      const l = num(v.currentLiabilities, "Current Liabilities", { min: 1 });
      const wc = a - l;
      const ratio = a / l;
      return {
        results: [
          { label: "Working Capital Ratio (Current Ratio)", value: `${ratio.toFixed(2)}:1`, primary: true },
          { label: "Net Working Capital", value: usd(wc) },
          { label: "Liquidity Status", value: ratio >= 1.5 ? "Healthy (Strong Buffer)" : ratio >= 1.0 ? "Adequate" : "Liquidity Risk" }
        ],
        formula: "Current Ratio = Current Assets / Current Liabilities"
      };
    }
  },

  // --- Marketing Suite ---
  "cost-per-click-calculator": {
    fields: [
      { id: "adSpend", label: "Total Advertising Spend (USD)", type: "number", default: "2500" },
      { id: "clicks", label: "Total Ad Clicks Generated", type: "number", default: "1650" }
    ],
    note: "Essential metric for Google Ads, Facebook Ads, and PPC campaign benchmarking.",
    compute(v) {
      const spend = num(v.adSpend, "Ad Spend", { min: 0 });
      const clicks = num(v.clicks, "Clicks", { min: 1 });
      const cpc = spend / clicks;
      return {
        results: [
          { label: "Cost Per Click (CPC)", value: usd(cpc), primary: true },
          { label: "Clicks Per $100 Spend", value: `${(100 / cpc).toFixed(0)} clicks` }
        ],
        formula: "CPC = Total Ad Spend / Total Clicks"
      };
    }
  },

  "cost-per-acquisition-calculator": {
    fields: [
      { id: "adSpend", label: "Total Marketing Spend (USD)", type: "number", default: "5000" },
      { id: "conversions", label: "Paying Customers Acquired", type: "number", default: "85" }
    ],
    note: "Determines the exact marketing investment required to win each new customer.",
    compute(v) {
      const spend = num(v.adSpend, "Spend", { min: 0 });
      const conv = num(v.conversions, "Conversions", { min: 1 });
      const cpa = spend / conv;
      return {
        results: [
          { label: "Cost Per Acquisition (CPA)", value: usd(cpa), primary: true },
          { label: "Acquisitions Per $1,000 Spend", value: `${(1000 / cpa).toFixed(1)} customers` }
        ],
        formula: "CPA = Total Campaign Spend / Total Conversions"
      };
    }
  },

  "email-campaign-roi-calculator": {
    fields: [
      { id: "revenue", label: "Total Revenue Generated from Email (USD)", type: "number", default: "14200" },
      { id: "cost", label: "Total Campaign & Tooling Cost (USD)", type: "number", default: "850" }
    ],
    note: "Calculates the return on investment for newsletter and automated drip marketing campaigns.",
    compute(v) {
      const rev = num(v.revenue, "Revenue", { min: 0 });
      const cost = num(v.cost, "Cost", { min: 1 });
      const roi = ((rev - cost) / cost) * 100;
      const profit = rev - cost;
      return {
        results: [
          { label: "Email Marketing ROI", value: pct(roi), primary: true },
          { label: "Net Campaign Profit", value: usd(profit) },
          { label: "Return Per $1 Invested", value: usd(rev / cost) }
        ],
        formula: "ROI = [(Revenue - Cost) / Cost] × 100%"
      };
    }
  },

  // --- Investment Suite ---
  "roth-vs-traditional-ira": {
    fields: [
      { id: "annualContrib", label: "Annual IRA Contribution (USD)", type: "number", default: "7000" },
      { id: "currentTaxRate", label: "Current Marginal Tax Rate %", type: "number", default: "24" },
      { id: "futureTaxRate", label: "Expected Retirement Tax Rate %", type: "number", default: "15" },
      { id: "growthRate", label: "Annual Investment Growth Rate %", type: "number", default: "7.5", step: "0.1" },
      { id: "years", label: "Years Until Retirement", type: "number", default: "25" }
    ],
    note: "Compares upfront tax deductions (Traditional) versus tax-free retirement withdrawals (Roth).",
    compute(v) {
      const c = num(v.annualContrib, "Contribution", { min: 0 });
      const r1 = num(v.currentTaxRate, "Current Rate") / 100;
      const r2 = num(v.futureTaxRate, "Future Rate") / 100;
      const g = num(v.growthRate, "Growth Rate") / 100;
      const yrs = num(v.years, "Years", { min: 1 });

      let fv = 0;
      for (let y = 1; y <= yrs; y++) fv = (fv + c) * (1 + g);
      const rothAfterTax = fv; // 100% tax free at retirement
      const tradAfterTax = fv * (1 - r2); // taxed upon withdrawal
      const upfrontTaxSavings = c * r1 * yrs;

      return {
        results: [
          { label: "Roth IRA Net Value (Tax-Free)", value: usd(rothAfterTax), primary: true },
          { label: "Traditional IRA Net After Retirement Taxes", value: usd(tradAfterTax) },
          { label: "Roth Advantage Over Traditional", value: usd(rothAfterTax - tradAfterTax) },
          { label: "Cumulative Traditional Upfront Deductions", value: usd(upfrontTaxSavings) }
        ],
        formula: "Roth = FV | Traditional = FV × (1 - Retirement Tax Rate)"
      };
    }
  },

  "capital-gains-tax-calculator": {
    fields: [
      { id: "gain", label: "Net Capital Gain Profit (USD)", type: "number", default: "45000" },
      { id: "holdingPeriod", label: "Holding Period", type: "select", default: "long", choices: [["long", "Long-Term (> 1 Year)"], ["short", "Short-Term (<= 1 Year)"]] },
      { id: "ordinaryRate", label: "Ordinary Income Tax Rate %", type: "number", default: "24" }
    ],
    note: "Short-term capital gains are taxed at ordinary income rates; long-term gains enjoy 0%, 15%, or 20% rates.",
    compute(v) {
      const gain = num(v.gain, "Capital Gain", { min: 0 });
      const isLong = v.holdingPeriod === "long";
      const ordRate = num(v.ordinaryRate, "Ordinary Rate") / 100;
      const rate = isLong ? 0.15 : ordRate;
      const tax = gain * rate;
      return {
        results: [
          { label: "Estimated Capital Gains Tax", value: usd(tax), primary: true },
          { label: "Applicable Tax Rate", value: pct(rate * 100) },
          { label: "Net After-Tax Proceeds", value: usd(gain - tax) }
        ],
        formula: isLong ? "Tax = Gain × 15% (Long-Term Capital Gains)" : "Tax = Gain × Ordinary Tax Rate (Short-Term)"
      };
    }
  },

  "cd-interest-calculator": {
    fields: [
      { id: "deposit", label: "Certificate of Deposit Amount (USD)", type: "number", default: "25000" },
      { id: "apy", label: "Annual Percentage Yield - APY (%)", type: "number", default: "4.75", step: "0.01" },
      { id: "termMonths", label: "CD Term (Months)", type: "number", default: "18" }
    ],
    note: "Computes fixed guaranteed interest earned on fixed-rate bank Certificate of Deposit accounts.",
    compute(v) {
      const p = num(v.deposit, "Deposit", { min: 0 });
      const apy = num(v.apy, "APY", { min: 0 }) / 100;
      const m = num(v.termMonths, "Months", { min: 1 });
      const total = p * Math.pow(1 + apy, m / 12);
      const interest = total - p;
      return {
        results: [
          { label: "Total Balance at Maturity", value: usd(total), primary: true },
          { label: "Guaranteed Interest Earned", value: usd(interest) },
          { label: "Monthly Interest Equivalent", value: usd(interest / m) }
        ],
        formula: "A = P × (1 + APY)^(months / 12)"
      };
    }
  }
};
