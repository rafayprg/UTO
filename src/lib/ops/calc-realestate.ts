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
  "fha-loan-calculator": extendedFinanceOps["fha-loan-calculator"],
  "va-loan-calculator": extendedFinanceOps["va-loan-calculator"],
  "heloc-payment-calculator": extendedFinanceOps["heloc-payment-calculator"],
  "commercial-cap-rate-calculator": extendedFinanceOps["commercial-cap-rate-calculator"],
  "gross-rent-multiplier-calculator": extendedFinanceOps["gross-rent-multiplier-calculator"],
  "cash-on-cash-return-calculator": extendedFinanceOps["cash-on-cash-return-calculator"],
  "closing-costs-estimator": extendedFinanceOps["closing-costs-estimator"],

  "amortization-schedule-calculator": {
    fields: [
      { id: "loanAmount", label: "Mortgage Loan Amount ($)", type: "number", default: "300000" },
      { id: "interestRate", label: "Annual Interest Rate (%)", type: "number", default: "6.5", step: "0.05" },
      { id: "loanTermYears", label: "Loan Term (Years)", type: "number", default: "30" }
    ],
    note: "Generates principal vs interest breakdown and a complete annual amortization table.",
    compute(v) {
      const loan = num(v.loanAmount, "Loan Amount", { min: 1000 });
      const annualRate = num(v.interestRate, "Interest Rate", { min: 0.01 }) / 100;
      const r = annualRate / 12;
      const years = num(v.loanTermYears, "Term Years", { min: 1, max: 50 });
      const n = years * 12;
      const monthlyPmt = (loan * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
      const totalPayments = monthlyPmt * n;
      const totalInterest = totalPayments - loan;

      let balance = loan;
      const rows: string[][] = [];
      for (let y = 1; y <= Math.min(years, 30); y++) {
        let yrInterest = 0;
        let yrPrincipal = 0;
        for (let m = 0; m < 12; m++) {
          const interestPart = balance * r;
          const principalPart = monthlyPmt - interestPart;
          yrInterest += interestPart;
          yrPrincipal += principalPart;
          balance -= principalPart;
        }
        rows.push([
          `Year ${y}`,
          usd(monthlyPmt * 12),
          usd(yrPrincipal),
          usd(yrInterest),
          usd(Math.max(0, balance))
        ]);
      }

      return {
        results: [
          { label: "Monthly Principal & Interest", value: usd(monthlyPmt), primary: true },
          { label: "Total Loan Interest Paid", value: usd(totalInterest) },
          { label: "Total Cost of Loan", value: usd(totalPayments) }
        ],
        formula: "M = P[r(1+r)^n] / [(1+r)^n - 1]",
        table: {
          head: ["Period", "Annual Payment", "Principal Paid", "Interest Paid", "Remaining Balance"],
          rows
        }
      };
    }
  },

  "property-tax-estimator": {
    fields: [
      { id: "assessedValue", label: "County Assessed Property Value ($)", type: "number", default: "320000" },
      { id: "millageRate", label: "Millage Rate (Tax rate per $1,000 of value)", type: "number", default: "18.5", step: "0.1" },
      { id: "homesteadExemption", label: "Homestead / Senior Exemption Deduction ($)", type: "number", default: "25000" }
    ],
    note: "Calculates annual and monthly escrow property taxes using local millage rates.",
    compute(v) {
      const value = num(v.assessedValue, "Assessed Value", { min: 1000 });
      const millage = num(v.millageRate, "Millage Rate", { min: 0 });
      const exemption = num(v.homesteadExemption, "Exemption", { min: 0 });
      const taxableValue = Math.max(0, value - exemption);
      const annualTax = (taxableValue / 1000) * millage;
      const monthlyEscrow = annualTax / 12;
      const effectiveRate = (annualTax / value) * 100;
      return {
        results: [
          { label: "Annual Property Tax", value: usd(annualTax), primary: true },
          { label: "Monthly Escrow Property Tax", value: usd(monthlyEscrow) },
          { label: "Effective Tax Rate", value: pct(effectiveRate) },
          { label: "Taxable Assessed Value", value: usd(taxableValue) }
        ],
        formula: "Annual Tax = [(Assessed Value - Exemption) / 1000] × Millage Rate"
      };
    }
  },

  "rental-yield-calculator": {
    fields: [
      { id: "propertyPrice", label: "Property Purchase Price ($)", type: "number", default: "280000" },
      { id: "monthlyRent", label: "Monthly Rental Income ($)", type: "number", default: "2100" },
      { id: "annualExpenses", label: "Annual Property Taxes, HOA, Insurance & Maintenance ($)", type: "number", default: "5800" }
    ],
    note: "Gross Rental Yield compares raw rent to purchase price; Net Rental Yield accounts for ongoing ownership expenses.",
    compute(v) {
      const price = num(v.propertyPrice, "Property Price", { min: 1000 });
      const rent = num(v.monthlyRent, "Monthly Rent", { min: 1 });
      const exp = num(v.annualExpenses, "Annual Expenses", { min: 0 });
      const grossAnnualRent = rent * 12;
      const netAnnualRent = grossAnnualRent - exp;
      const grossYield = (grossAnnualRent / price) * 100;
      const netYield = (netAnnualRent / price) * 100;
      return {
        results: [
          { label: "Gross Rental Yield", value: pct(grossYield), primary: true },
          { label: "Net Rental Yield", value: pct(netYield) },
          { label: "Annual Net Operating Cash Flow", value: usd(netAnnualRent) }
        ],
        formula: "Gross Yield = (Annual Rent / Price) | Net Yield = (Net Rent - Expenses) / Price"
      };
    }
  },

  "refinance-breakeven-calculator": {
    fields: [
      { id: "currentBalance", label: "Current Loan Balance ($)", type: "number", default: "320000" },
      { id: "currentPmt", label: "Current Monthly Payment (P&I) ($)", type: "number", default: "2150" },
      { id: "newInterestRate", label: "New Proposed Interest Rate (%)", type: "number", default: "5.5", step: "0.05" },
      { id: "newLoanTermYears", label: "New Loan Term (Years)", type: "number", default: "30" },
      { id: "closingCosts", label: "Refinance Closing Costs ($)", type: "number", default: "5500" }
    ],
    note: "Calculates monthly mortgage payment reduction and the exact number of months needed to recoup upfront closing fees.",
    compute(v) {
      const bal = num(v.currentBalance, "Balance", { min: 1000 });
      const curPmt = num(v.currentPmt, "Current Payment", { min: 10 });
      const r = (num(v.newInterestRate, "New Rate", { min: 0.01 }) / 100) / 12;
      const n = num(v.newLoanTermYears, "New Term", { min: 1 }) * 12;
      const fees = num(v.closingCosts, "Closing Costs", { min: 0 });
      const newPmt = (bal * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
      const monthlySavings = curPmt - newPmt;
      if (monthlySavings <= 0) {
        return {
          results: [
            { label: "Monthly Payment Change", value: `+${usd(Math.abs(monthlySavings))} (Higher payment)`, primary: true },
            { label: "Breakeven Status", value: "Refinancing does not reduce monthly payment" }
          ],
          formula: "Monthly Savings = Current Payment - New Payment"
        };
      }
      const breakevenMonths = Math.ceil(fees / monthlySavings);
      return {
        results: [
          { label: "Breakeven Horizon", value: `${breakevenMonths} months (${(breakevenMonths / 12).toFixed(1)} years)`, primary: true },
          { label: "Monthly Payment Savings", value: usd(monthlySavings) },
          { label: "New Monthly Payment (P&I)", value: usd(newPmt) },
          { label: "5-Year Cumulative Net Savings", value: usd((monthlySavings * 60) - fees) }
        ],
        formula: "Breakeven Months = Closing Costs / Monthly Savings"
      };
    }
  },

  "exchange-1031-tax-deferral": {
    fields: [
      { id: "salePrice", label: "Relinquished Property Sale Price ($)", type: "number", default: "650000" },
      { id: "purchaseBasis", label: "Original Purchase Basis + Capital Improvements ($)", type: "number", default: "350000" },
      { id: "depreciationTaken", label: "Total Depreciation Claimed to Date ($)", type: "number", default: "95000" },
      { id: "replacementPropertyPrice", label: "Replacement Property Purchase Price ($)", type: "number", default: "750000" }
    ],
    note: "Calculates capital gains tax and 25% depreciation recapture tax deferred under IRC § 1031 like-kind exchange.",
    compute(v) {
      const sale = num(v.salePrice, "Sale Price", { min: 1000 });
      const basis = num(v.purchaseBasis, "Basis", { min: 1000 });
      const depr = num(v.depreciationTaken, "Depreciation", { min: 0 });
      const repl = num(v.replacementPropertyPrice, "Replacement Price", { min: 1000 });
      const adjustedBasis = basis - depr;
      const totalGain = sale - adjustedBasis;
      const capGainsTax = (totalGain - depr) * 0.20; // 20% federal long-term
      const deprRecaptureTax = depr * 0.25; // 25% recapture
      const niitTax = totalGain * 0.038; // 3.8% Net Investment Income Tax
      const totalTaxLiability = capGainsTax + deprRecaptureTax + niitTax;
      const boot = Math.max(0, sale - repl);
      return {
        results: [
          { label: "Total Taxes Deferred via 1031", value: usd(totalTaxLiability), primary: true },
          { label: "Total Realized Gain", value: usd(totalGain) },
          { label: "Depreciation Recapture Tax (25%)", value: usd(deprRecaptureTax) },
          { label: "Federal Long-Term Capital Gains Tax (20%)", value: usd(capGainsTax) },
          { label: "Taxable Boot (Cash/Mortgage Relief)", value: usd(boot) }
        ],
        formula: "Deferred Tax = (Capital Gain × 20%) + (Depreciation Taken × 25%) + NIIT (3.8%)"
      };
    }
  },

  "fix-and-flip-profit": {
    fields: [
      { id: "purchasePrice", label: "Distressed Property Purchase Price ($)", type: "number", default: "185000" },
      { id: "rehabCosts", label: "Estimated Renovation & Material Costs ($)", type: "number", default: "55000" },
      { id: "arv", label: "After Repair Value (ARV) Sale Price ($)", type: "number", default: "310000" },
      { id: "holdingMonths", label: "Holding Timeline (Months)", type: "number", default: "6" },
      { id: "monthlyHoldingCosts", label: "Monthly Loan Interest, Utilities & Insurance ($)", type: "number", default: "1800" },
      { id: "sellingCostsRate", label: "Realtor Commissions & Closing Costs on Exit (%)", type: "number", default: "7.0", step: "0.5" }
    ],
    note: "Comprehensive fix-and-flip underwriting including hard-money holding costs and realtor commissions.",
    compute(v) {
      const buy = num(v.purchasePrice, "Purchase Price", { min: 1000 });
      const rehab = num(v.rehabCosts, "Rehab Costs", { min: 0 });
      const arv = num(v.arv, "ARV", { min: buy });
      const months = num(v.holdingMonths, "Holding Months", { min: 1 });
      const monthlyHold = num(v.monthlyHoldingCosts, "Monthly Hold", { min: 0 });
      const exitRate = num(v.sellingCostsRate, "Selling Cost %", { min: 0 }) / 100;
      const totalHolding = months * monthlyHold;
      const exitCosts = arv * exitRate;
      const totalInvested = buy + rehab + totalHolding + exitCosts;
      const netProfit = arv - totalInvested;
      const roi = (netProfit / (buy + rehab + totalHolding)) * 100;
      return {
        results: [
          { label: "Net Flip Profit", value: usd(netProfit), primary: true },
          { label: "Return on Investment (ROI)", value: pct(roi) },
          { label: "Total All-In Project Cost", value: usd(totalInvested) },
          { label: "Total Holding Costs", value: usd(totalHolding) }
        ],
        formula: "Net Profit = ARV - (Purchase + Rehab + Holding Costs + Selling Fees)"
      };
    }
  },

  "airbnb-vs-longterm": {
    fields: [
      { id: "strNightlyRate", label: "Airbnb Average Nightly Rate ($)", type: "number", default: "195" },
      { id: "strOccupancyRate", label: "Airbnb Occupancy Rate (%)", type: "number", default: "68", step: "1" },
      { id: "strPlatformFeeRate", label: "Airbnb Platform & Cleaning Overhead (%)", type: "number", default: "18", step: "1" },
      { id: "ltrMonthlyRent", label: "Long-Term Rental Monthly Rent ($)", type: "number", default: "2200" },
      { id: "ltrVacancyRate", label: "Long-Term Annual Vacancy Rate (%)", type: "number", default: "5", step: "1" }
    ],
    note: "Compares net monthly revenue between Short-Term Vacation Rental (STR) and traditional Long-Term Rental (LTR).",
    compute(v) {
      const nightly = num(v.strNightlyRate, "Nightly Rate", { min: 10 });
      const occ = num(v.strOccupancyRate, "Occupancy %", { min: 1, max: 100 }) / 100;
      const fee = num(v.strPlatformFeeRate, "STR Fee %", { min: 0, max: 50 }) / 100;
      const ltrRent = num(v.ltrMonthlyRent, "LTR Rent", { min: 100 });
      const ltrVac = num(v.ltrVacancyRate, "LTR Vacancy %", { min: 0, max: 50 }) / 100;
      const strMonthlyGross = nightly * (30.416 * occ);
      const strMonthlyNet = strMonthlyGross * (1 - fee);
      const ltrMonthlyNet = ltrRent * (1 - ltrVac);
      const difference = strMonthlyNet - ltrMonthlyNet;
      return {
        results: [
          { label: "Airbnb Net Monthly Cash Flow", value: usd(strMonthlyNet), primary: true },
          { label: "Long-Term Rental Net Monthly", value: usd(ltrMonthlyNet) },
          { label: "Monthly Premium (STR vs LTR)", value: `${difference >= 0 ? "+" : ""}${usd(difference)} / month` }
        ],
        formula: "STR Net = (Nightly × 30.4 × Occ%) × (1 - Fee%) | LTR Net = Rent × (1 - Vacancy%)"
      };
    }
  },

  "dti-ratio-calculator": {
    fields: [
      { id: "grossMonthlyIncome", label: "Gross Monthly Household Income ($)", type: "number", default: "9500" },
      { id: "mortgagePmt", label: "Proposed Monthly Housing Payment (PITI + HOA) ($)", type: "number", default: "2450" },
      { id: "autoLoans", label: "Monthly Auto Loan Payments ($)", type: "number", default: "450" },
      { id: "studentLoans", label: "Monthly Student Loan Payments ($)", type: "number", default: "300" },
      { id: "creditCards", label: "Minimum Monthly Credit Card Payments ($)", type: "number", default: "150" }
    ],
    note: "Mortgage guidelines: Front-End (housing) ideally ≤ 28%; Back-End (total debt) ideally ≤ 36% (Conventional limit 43-45%, FHA up to 50%).",
    compute(v) {
      const income = num(v.grossMonthlyIncome, "Monthly Income", { min: 100, allowZero: false });
      const piti = num(v.mortgagePmt, "Housing Payment", { min: 0 });
      const auto = num(v.autoLoans, "Auto Loans", { min: 0 });
      const student = num(v.studentLoans, "Student Loans", { min: 0 });
      const cc = num(v.creditCards, "Credit Cards", { min: 0 });
      const totalDebt = piti + auto + student + cc;
      const frontEnd = (piti / income) * 100;
      const backEnd = (totalDebt / income) * 100;
      return {
        results: [
          { label: "Back-End DTI (Total Debt Ratio)", value: pct(backEnd), primary: true },
          { label: "Front-End DTI (Housing Ratio)", value: pct(frontEnd) },
          { label: "Conventional Underwriting", value: backEnd <= 43 ? "Approved (≤ 43% DTI)" : "Caution (Exceeds 43% threshold)" },
          { label: "Total Monthly Debt Obligations", value: usd(totalDebt) }
        ],
        formula: "Front-End = Housing / Income | Back-End = Total Debt / Income"
      };
    }
  },

  "brrrr-strategy-calculator": {
    fields: [
      { id: "buyPrice", label: "Buy: Initial Purchase Price ($)", type: "number", default: "140000" },
      { id: "rehabCost", label: "Rehab: Total Renovation Cost ($)", type: "number", default: "45000" },
      { id: "arv", label: "Refinance: Appraised ARV ($)", type: "number", default: "250000" },
      { id: "refiLtvRate", label: "Refinance: Lender Cash-Out LTV (%)", type: "number", default: "75", step: "1" },
      { id: "monthlyRent", label: "Rent: Monthly Rental Income ($)", type: "number", default: "1950" },
      { id: "newMortgagePmt", label: "Post-Refinance Monthly PITI Mortgage ($)", type: "number", default: "1280" }
    ],
    note: "Underwrites the complete BRRRR loop: Buy, Rehab, Rent, Refinance, Repeat. Calculates cash trapped or cash returned.",
    compute(v) {
      const buy = num(v.buyPrice, "Buy Price", { min: 1000 });
      const rehab = num(v.rehabCost, "Rehab Cost", { min: 0 });
      const arv = num(v.arv, "ARV", { min: buy });
      const ltv = num(v.refiLtvRate, "LTV %", { min: 1, max: 95 }) / 100;
      const rent = num(v.monthlyRent, "Rent", { min: 100 });
      const piti = num(v.newMortgagePmt, "Mortgage", { min: 10 });
      const initialCashIn = buy + rehab;
      const refiLoanAmount = arv * ltv;
      const cashReturned = refiLoanAmount - initialCashIn;
      const cashTrapped = Math.max(0, initialCashIn - refiLoanAmount);
      const monthlyCashFlow = rent - piti;
      const equityCreated = arv - refiLoanAmount;
      return {
        results: [
          { label: "Cash Trapped in Deal", value: cashReturned >= 0 ? "$0 (100% Capital Recouped!)" : usd(cashTrapped), primary: true },
          { label: "New Refinance Loan Amount (Cash-Out)", value: usd(refiLoanAmount) },
          { label: "Net Cash Flow After Refinance", value: `${usd(monthlyCashFlow)} / month` },
          { label: "Retained Equity", value: usd(equityCreated) }
        ],
        formula: "Cash Trapped = (Buy + Rehab) - (ARV × LTV%)"
      };
    }
  },

  "down-payment-timeline": {
    fields: [
      { id: "targetHomePrice", label: "Target Home Price ($)", type: "number", default: "450000" },
      { id: "downPaymentPercent", label: "Target Down Payment % (e.g. 20% to avoid PMI)", type: "number", default: "20", step: "1" },
      { id: "currentSavings", label: "Current Dedicated Savings ($)", type: "number", default: "18000" },
      { id: "monthlyContribution", label: "Monthly Savings Contribution ($)", type: "number", default: "1800" },
      { id: "annualHysaRate", label: "HYSA Annual Yield (%)", type: "number", default: "4.5", step: "0.1" }
    ],
    note: "Calculates the exact months required to save your home down payment factoring high-yield compounding.",
    compute(v) {
      const price = num(v.targetHomePrice, "Home Price", { min: 1000 });
      const dpRate = num(v.downPaymentPercent, "Down Payment %", { min: 1, max: 100 }) / 100;
      let balance = num(v.currentSavings, "Current Savings", { min: 0 });
      const pmt = num(v.monthlyContribution, "Monthly Savings", { min: 1, allowZero: false });
      const monthlyRate = (num(v.annualHysaRate, "HYSA Yield", { min: 0 }) / 100) / 12;
      const goal = price * dpRate;
      if (balance >= goal) {
        return {
          results: [
            { label: "Target Down Payment Goal", value: usd(goal), primary: true },
            { label: "Status", value: "Goal already achieved with current savings!" }
          ]
        };
      }
      let months = 0;
      while (balance < goal && months < 360) {
        balance += pmt + (balance * monthlyRate);
        months++;
      }
      return {
        results: [
          { label: "Savings Horizon", value: `${months} months (${(months / 12).toFixed(1)} years)`, primary: true },
          { label: "Target Down Payment Goal", value: usd(goal) },
          { label: "Additional Savings Needed", value: usd(goal - num(v.currentSavings, "Savings")) }
        ],
        formula: "Future Value of Annuity Compounded Monthly"
      };
    }
  },

  "land-transfer-tax-estimator": {
    fields: [
      { id: "purchasePrice", label: "Property Purchase Price ($)", type: "number", default: "500000" },
      { id: "transferTaxRate", label: "State / Municipal Transfer Tax Rate (%) (US avg 0.5% - 2.0%)", type: "number", default: "1.25", step: "0.05" },
      { id: "firstTimeBuyerRebate", label: "First-Time Homebuyer Tax Rebate ($)", type: "number", default: "2000" }
    ],
    note: "Estimates deed transfer tax, stamp duty, or real estate excise tax (REET) due at closing.",
    compute(v) {
      const price = num(v.purchasePrice, "Purchase Price", { min: 1000 });
      const rate = num(v.transferTaxRate, "Tax Rate %", { min: 0 }) / 100;
      const rebate = num(v.firstTimeBuyerRebate, "Rebate", { min: 0 });
      const grossTax = price * rate;
      const netTax = Math.max(0, grossTax - rebate);
      return {
        results: [
          { label: "Net Land Transfer Tax Due", value: usd(netTax), primary: true },
          { label: "Gross Transfer Tax (Deed Stamp)", value: usd(grossTax) },
          { label: "Applied First-Time Rebate", value: usd(Math.min(grossTax, rebate)) }
        ],
        formula: "Net Transfer Tax = (Purchase Price × Tax Rate %) - Rebate"
      };
    }
  },

  "rent-vs-buy-equity": {
    fields: [
      { id: "homePrice", label: "Home Purchase Price ($)", type: "number", default: "400000" },
      { id: "downPayment", label: "Down Payment ($)", type: "number", default: "80000" },
      { id: "monthlyRent", label: "Comparable Monthly Rent ($)", type: "number", default: "2400" },
      { id: "homeAppreciationRate", label: "Annual Home Price Appreciation (%)", type: "number", default: "3.5", step: "0.1" },
      { id: "years", label: "Time Horizon (Years)", type: "number", default: "7" }
    ],
    note: "Projects home equity built through mortgage paydown and appreciation versus renting.",
    compute(v) {
      const price = num(v.homePrice, "Home Price", { min: 1000 });
      num(v.downPayment, "Down Payment", { min: 0 });
      const rent = num(v.monthlyRent, "Rent", { min: 100 });
      const app = num(v.homeAppreciationRate, "Appreciation Rate", { min: 0 }) / 100;
      const yrs = num(v.years, "Years", { min: 1, max: 40 });
      const futureHomeValue = price * Math.pow(1 + app, yrs);
      const homeEquityCreated = (futureHomeValue - price) + (price * 0.15); // appreciation + rough paydown
      const totalRentPaid = rent * 12 * yrs;
      return {
        results: [
          { label: "Projected Home Value in Horizon", value: usd(futureHomeValue), primary: true },
          { label: "Estimated Wealth/Equity Created (Buying)", value: usd(homeEquityCreated) },
          { label: "Total Rent Sunk (Zero Equity)", value: usd(totalRentPaid) }
        ],
        formula: "Future Value = Price × (1 + g)^t"
      };
    }
  },

  "hoa-fee-purchasing-power": {
    fields: [
      { id: "monthlyHoaFee", label: "Monthly Condo / HOA Dues ($)", type: "number", default: "450" },
      { id: "mortgageRate", label: "Mortgage Interest Rate (%)", type: "number", default: "6.5", step: "0.05" },
      { id: "termYears", label: "Loan Term (Years)", type: "number", default: "30" }
    ],
    note: "Calculates how much mortgage borrowing power is reduced by monthly HOA fees under lender DTI limits.",
    compute(v) {
      const hoa = num(v.monthlyHoaFee, "HOA Fee", { min: 1 });
      const r = (num(v.mortgageRate, "Interest Rate", { min: 0.01 }) / 100) / 12;
      const n = num(v.termYears, "Term", { min: 1 }) * 12;
      const lostBorrowingPower = hoa * ((Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n)));
      return {
        results: [
          { label: "Lost Purchasing Power / Loan Amount", value: usd(lostBorrowingPower), primary: true },
          { label: "Equivalent Mortgage Principal", value: `A $${hoa}/mo HOA fee borrows ~$${Math.round(lostBorrowingPower).toLocaleString()} less home` }
        ],
        formula: "PV = Monthly HOA × [1 - (1+r)^(-n)] / r"
      };
    }
  },

  "mortgage-apr-vs-rate": {
    fields: [
      { id: "loanAmount", label: "Mortgage Loan Amount ($)", type: "number", default: "350000" },
      { id: "interestRate", label: "Note Interest Rate (%)", type: "number", default: "6.5", step: "0.05" },
      { id: "upfrontClosingCosts", label: "Financed Lender Fees & Points ($)", type: "number", default: "6500" },
      { id: "termYears", label: "Loan Term (Years)", type: "number", default: "30" }
    ],
    note: "Truth-in-Lending Act (TILA): Annual Percentage Rate (APR) incorporates upfront origination fees and points into the annual rate.",
    compute(v) {
      const loan = num(v.loanAmount, "Loan Amount", { min: 1000 });
      const noteRate = num(v.interestRate, "Note Rate", { min: 0.01 }) / 100;
      const r = noteRate / 12;
      const fees = num(v.upfrontClosingCosts, "Fees", { min: 0 });
      const n = num(v.termYears, "Term", { min: 1 }) * 12;
      const pmt = (loan * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
      const netProceeds = loan - fees;
      // Solve for apr using Newton-Raphson approximation
      let apr = noteRate;
      for (let i = 0; i < 20; i++) {
        const rateM = apr / 12;
        const f = (netProceeds * rateM * Math.pow(1 + rateM, n)) / (Math.pow(1 + rateM, n) - 1) - pmt;
        apr -= f * 0.001;
      }
      const aprPct = Math.max(noteRate, (noteRate + (fees / loan / (n / 12)))) * 100;
      return {
        results: [
          { label: "Calculated APR (True Cost of Credit)", value: pct(aprPct), primary: true },
          { label: "Note Interest Rate", value: pct(noteRate * 100) },
          { label: "Monthly Payment (P&I)", value: usd(pmt) }
        ],
        formula: "APR accounts for upfront lender fees amortized over the loan term"
      };
    }
  },

  "biweekly-mortgage-savings": {
    fields: [
      { id: "loanAmount", label: "Current Loan Balance ($)", type: "number", default: "350000" },
      { id: "interestRate", label: "Interest Rate (%)", type: "number", default: "6.5", step: "0.05" },
      { id: "termYears", label: "Remaining Term (Years)", type: "number", default: "30" }
    ],
    note: "Making 26 half-payments per year equals 13 full payments, accelerating payoff by roughly 4 to 6 years.",
    compute(v) {
      const loan = num(v.loanAmount, "Loan Amount", { min: 1000 });
      const r = (num(v.interestRate, "Interest Rate", { min: 0.01 }) / 100) / 12;
      const n = num(v.termYears, "Term", { min: 1 }) * 12;
      const monthlyPmt = (loan * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
      const biweeklyPmt = monthlyPmt / 2;
      const extraAnnualPrincipal = monthlyPmt;
      const totalStandardInterest = (monthlyPmt * n) - loan;
      // Approximate biweekly accelerated interest
      const interestSaved = totalStandardInterest * 0.22; // approx 20-25% saved
      const yearsSaved = Math.round(num(v.termYears, "Term") * 0.17);
      return {
        results: [
          { label: "Total Interest Saved with Bi-Weekly", value: usd(interestSaved), primary: true },
          { label: "Years Cut Off Mortgage", value: `~${yearsSaved} years earlier` },
          { label: "Every-2-Weeks Payment Amount", value: usd(biweeklyPmt) },
          { label: "Standard Monthly Payment", value: usd(monthlyPmt) },
          { label: "Annual Extra Principal Paid", value: usd(extraAnnualPrincipal) }
        ],
        formula: "Bi-Weekly = 26 half-payments (13 full payments/year)"
      };
    }
  },

  "rule-70-house-flipping": {
    fields: [
      { id: "arv", label: "After Repair Value (ARV) ($)", type: "number", default: "350000" },
      { id: "estimatedRepairs", label: "Estimated Repair & Renovation Cost ($)", type: "number", default: "45000" }
    ],
    note: "The classic real estate investor 70% Rule calculates the Maximum Allowable Offer (MAO).",
    compute(v) {
      const arv = num(v.arv, "ARV", { min: 1000 });
      const repairs = num(v.estimatedRepairs, "Repairs", { min: 0 });
      const mao = (arv * 0.70) - repairs;
      return {
        results: [
          { label: "Maximum Allowable Offer (MAO)", value: usd(mao), primary: true },
          { label: "70% ARV Baseline", value: usd(arv * 0.70) },
          { label: "Built-In Profit & Holding Margin (30%)", value: usd(arv * 0.30) }
        ],
        formula: "MAO = (ARV × 0.70) - Estimated Repairs"
      };
    }
  },

  "prorated-rent-calculator": {
    fields: [
      { id: "monthlyRent", label: "Full Monthly Rent ($)", type: "number", default: "2100" },
      { id: "moveInDay", label: "Move-In Day of Month (e.g. 18 for the 18th)", type: "number", default: "18" },
      { id: "daysInMonth", label: "Total Days in Month (e.g. 30 or 31)", type: "number", default: "30" }
    ],
    note: "Calculates exact daily rent and partial month move-in or move-out rent due.",
    compute(v) {
      const rent = num(v.monthlyRent, "Rent", { min: 1 });
      const day = num(v.moveInDay, "Move-In Day", { min: 1, max: 31 });
      const totalDays = num(v.daysInMonth, "Days in Month", { min: day, max: 31 });
      const daysOccupied = totalDays - day + 1;
      const dailyRate = rent / totalDays;
      const proratedDue = dailyRate * daysOccupied;
      return {
        results: [
          { label: "Prorated Rent Due at Move-In", value: usd(proratedDue), primary: true },
          { label: "Daily Rental Rate", value: usd(dailyRate) },
          { label: "Days Billed", value: `${daysOccupied} of ${totalDays} days` }
        ],
        formula: "Prorated Rent = (Monthly Rent / Days in Month) × Days Occupied"
      };
    }
  },

  "operating-expense-ratio-oer": {
    fields: [
      { id: "operatingExpenses", label: "Total Annual Operating Expenses ($) (Taxes, Ins, Maint, Mgt)", type: "number", default: "42000" },
      { id: "grossOperatingIncome", label: "Gross Operating Income ($) (Rent collected after vacancy)", type: "number", default: "95000" }
    ],
    note: "Operating Expense Ratio (OER) measures commercial and multifamily operational efficiency. Healthy range is 35% - 45%.",
    compute(v) {
      const exp = num(v.operatingExpenses, "Expenses", { min: 0 });
      const goi = num(v.grossOperatingIncome, "GOI", { min: 1, allowZero: false });
      const oer = (exp / goi) * 100;
      return {
        results: [
          { label: "Operating Expense Ratio (OER)", value: pct(oer), primary: true },
          { label: "Assessment", value: oer <= 45 ? "Healthy Efficiency (≤ 45%)" : "High Overhead Expense Profile (> 45%)" },
          { label: "Net Operating Income (NOI)", value: usd(goi - exp) }
        ],
        formula: "OER = (Operating Expenses / Gross Operating Income) × 100"
      };
    }
  },

  "square-footage-price": {
    fields: [
      { id: "propertyPrice", label: "Property Price ($)", type: "number", default: "425000" },
      { id: "totalSqFt", label: "Total Finished Square Footage", type: "number", default: "2200" }
    ],
    note: "Calculates Price Per Square Foot ($/sq ft) and Price Per Square Meter ($/m²).",
    compute(v) {
      const price = num(v.propertyPrice, "Price", { min: 1 });
      const sqft = num(v.totalSqFt, "SqFt", { min: 1, allowZero: false });
      const perSqFt = price / sqft;
      const perSqM = perSqFt * 10.7639;
      return {
        results: [
          { label: "Price Per Square Foot ($/sq ft)", value: usd(perSqFt), primary: true },
          { label: "Price Per Square Meter ($/m²)", value: usd(perSqM) }
        ],
        formula: "Price / SqFt"
      };
    }
  },

  "property-management-fee": {
    fields: [
      { id: "monthlyRent", label: "Monthly Rental Income ($)", type: "number", default: "2400" },
      { id: "managementRate", label: "Ongoing Management Fee (%) (Industry avg 8% - 12%)", type: "number", default: "10", step: "0.5" },
      { id: "leaseUpFee", label: "Tenant Placement / Lease-Up Fee ($)", type: "number", default: "1200" }
    ],
    note: "Calculates monthly and annual property management overhead costs.",
    compute(v) {
      const rent = num(v.monthlyRent, "Rent", { min: 100 });
      const rate = num(v.managementRate, "Management %", { min: 0 }) / 100;
      const leaseFee = num(v.leaseUpFee, "Lease-Up Fee", { min: 0 });
      const monthlyFee = rent * rate;
      const annualOngoing = monthlyFee * 12;
      const totalYearOne = annualOngoing + leaseFee;
      return {
        results: [
          { label: "Monthly Management Fee", value: usd(monthlyFee), primary: true },
          { label: "Annual Ongoing Fee", value: usd(annualOngoing) },
          { label: "Year 1 Total Cost (inc. Placement)", value: usd(totalYearOne) }
        ],
        formula: "Monthly Fee = Monthly Rent × Fee %"
      };
    }
  },

  "seller-net-sheet": {
    fields: [
      { id: "contractPrice", label: "Home Agreed Sale Price ($)", type: "number", default: "450000" },
      { id: "mortgagePayoff", label: "Existing Mortgage Payoff Balance ($)", type: "number", default: "210000" },
      { id: "brokerCommissionRate", label: "Total Real Estate Commission Rate (%)", type: "number", default: "5.5", step: "0.25" },
      { id: "sellerClosingCosts", label: "Estimated Seller Closing & Title Fees ($)", type: "number", default: "4500" }
    ],
    note: "Calculates the estimated net cash walk-away proceeds for a home seller at closing.",
    compute(v) {
      const sale = num(v.contractPrice, "Sale Price", { min: 1000 });
      const payoff = num(v.mortgagePayoff, "Mortgage Payoff", { min: 0 });
      const commRate = num(v.brokerCommissionRate, "Commission %", { min: 0 }) / 100;
      const fees = num(v.sellerClosingCosts, "Closing Fees", { min: 0 });
      const commission = sale * commRate;
      const netProceeds = sale - payoff - commission - fees;
      return {
        results: [
          { label: "Estimated Seller Net Proceeds", value: usd(netProceeds), primary: true },
          { label: "Realtor Commissions Paid", value: usd(commission) },
          { label: "Mortgage Debt Cleared", value: usd(payoff) }
        ],
        formula: "Net Proceeds = Sale Price - Mortgage Payoff - Commissions - Closing Fees"
      };
    }
  },

  "mortgage-points-breakeven": {
    fields: [
      { id: "loanAmount", label: "Mortgage Loan Amount ($)", type: "number", default: "400000" },
      { id: "pointsPurchased", label: "Discount Points Purchased (1 point = 1% of loan)", type: "number", default: "1.5", step: "0.25" },
      { id: "monthlySavings", label: "Monthly Payment Savings from Lower Rate ($)", type: "number", default: "65" }
    ],
    note: "Calculates the exact number of months to break even on buying mortgage discount points.",
    compute(v) {
      const loan = num(v.loanAmount, "Loan Amount", { min: 1000 });
      const points = num(v.pointsPurchased, "Points", { min: 0.1 });
      const savings = num(v.monthlySavings, "Monthly Savings", { min: 1, allowZero: false });
      const upfrontCost = loan * (points / 100);
      const breakevenMonths = Math.ceil(upfrontCost / savings);
      return {
        results: [
          { label: "Points Breakeven Horizon", value: `${breakevenMonths} months (${(breakevenMonths / 12).toFixed(1)} years)`, primary: true },
          { label: "Upfront Cost of Discount Points", value: usd(upfrontCost) }
        ],
        formula: "Breakeven Months = (Loan Amount × Points %) / Monthly Savings"
      };
    }
  },

  "home-equity-loan-vs-heloc": {
    fields: [
      { id: "borrowAmount", label: "Desired Borrowing Amount ($)", type: "number", default: "60000" },
      { id: "fixedLoanRate", label: "Fixed Home Equity Loan Rate (%)", type: "number", default: "8.5", step: "0.1" },
      { id: "helocVariableRate", label: "HELOC Initial Variable Rate (%)", type: "number", default: "9.25", step: "0.1" },
      { id: "termYears", label: "Loan Term (Years)", type: "number", default: "15" }
    ],
    note: "Compares predictable fixed-rate second mortgages against variable-rate lines of credit.",
    compute(v) {
      const amount = num(v.borrowAmount, "Borrow Amount", { min: 1000 });
      const rFixed = (num(v.fixedLoanRate, "Fixed Rate", { min: 0.01 }) / 100) / 12;
      const rHeloc = (num(v.helocVariableRate, "HELOC Rate", { min: 0.01 }) / 100) / 12;
      const n = num(v.termYears, "Term", { min: 1 }) * 12;
      const fixedMonthly = (amount * (rFixed * Math.pow(1 + rFixed, n))) / (Math.pow(1 + rFixed, n) - 1);
      const helocInterestOnly = amount * rHeloc;
      return {
        results: [
          { label: "Fixed Equity Loan Monthly Payment (P&I)", value: usd(fixedMonthly), primary: true },
          { label: "HELOC Interest-Only Draw Payment", value: usd(helocInterestOnly) }
        ],
        formula: "Fixed P&I amortization vs HELOC Interest-Only Draw Phase"
      };
    }
  },

  "real-estate-commission-split": {
    fields: [
      { id: "salePrice", label: "Property Agreed Sale Price ($)", type: "number", default: "480000" },
      { id: "totalCommissionRate", label: "Total Gross Commission Rate (%)", type: "number", default: "5.5", step: "0.25" },
      { id: "agentBrokerSplit", label: "Agent / Brokerage Split % (e.g. 70/30 = 70%)", type: "number", default: "75", step: "1" }
    ],
    note: "Calculates listing broker, buyer broker, and agent take-home commissions.",
    compute(v) {
      const price = num(v.salePrice, "Sale Price", { min: 1000 });
      const grossRate = num(v.totalCommissionRate, "Total Rate", { min: 0 }) / 100;
      const agentSplit = num(v.agentBrokerSplit, "Agent Split", { min: 1, max: 100 }) / 100;
      const totalCommission = price * grossRate;
      const sideCommission = totalCommission / 2; // typical 50/50 listing/buyer split
      const agentNet = sideCommission * agentSplit;
      const brokerageCut = sideCommission * (1 - agentSplit);
      return {
        results: [
          { label: "Agent Net Take-Home (One Side)", value: usd(agentNet), primary: true },
          { label: "Side Gross Commission (2.75%)", value: usd(sideCommission) },
          { label: "Brokerage Retained Share", value: usd(brokerageCut) },
          { label: "Total Gross Commission", value: usd(totalCommission) }
        ],
        formula: "Agent Net = (Total Commission / 2) × Agent Split %"
      };
    }
  },

  "adu-roi-calculator": {
    fields: [
      { id: "constructionCost", label: "Total ADU Construction / Prefab Cost ($)", type: "number", default: "165000" },
      { id: "monthlyRentalIncome", label: "Projected Monthly ADU Rental Income ($)", type: "number", default: "1850" },
      { id: "annualExpenses", label: "Annual Extra Taxes, Insurance & Utilities ($)", type: "number", default: "3200" }
    ],
    note: "Underwrites building an Accessory Dwelling Unit (Granny Flat / Backyard Cottage) for rental income.",
    compute(v) {
      const cost = num(v.constructionCost, "Construction Cost", { min: 1000 });
      const rent = num(v.monthlyRentalIncome, "Monthly Rent", { min: 100 });
      const exp = num(v.annualExpenses, "Annual Expenses", { min: 0 });
      const netAnnualIncome = (rent * 12) - exp;
      const roi = (netAnnualIncome / cost) * 100;
      const paybackYears = cost / netAnnualIncome;
      return {
        results: [
          { label: "ADU Cash-on-Cash Return", value: pct(roi), primary: true },
          { label: "Annual Net Rental Income", value: usd(netAnnualIncome) },
          { label: "Capital Payback Horizon", value: `${paybackYears.toFixed(1)} years` }
        ],
        formula: "ROI = [(Annual Rent - Expenses) / Total Construction Cost] × 100"
      };
    }
  }
};
