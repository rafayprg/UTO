// scripts/generate-batch4.mjs
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// --- 1. CALC BUSINESS (33 ops) ---
const businessOpsSource = `import type { CalcOp } from "./types";
import { extendedFinanceOps } from "./calc-finance-extended";

function num(value: string, label: string, { min = -Infinity, allowZero = true } = {}): number {
  const parsed = Number(String(value).replace(/,/g, "").trim());
  if (value.trim() === "" || !Number.isFinite(parsed)) throw new Error(\`Enter a number for \${label}.\`);
  if (parsed < min || (!allowZero && parsed === 0)) throw new Error(\`\${label} must be \${allowZero ? "at least" : "greater than"} \${min}.\`);
  return parsed;
}

const usd = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD" });
const pct = (v: number) => \`\${v.toFixed(2)}%\`;

export const ops: Record<string, CalcOp> = {
  // Existing extended ops
  "scorp-tax-calculator": extendedFinanceOps["scorp-tax-calculator"],
  "inventory-turnover-calculator": extendedFinanceOps["inventory-turnover-calculator"],
  "working-capital-ratio-calculator": extendedFinanceOps["working-capital-ratio-calculator"],

  "clv-calculator": {
    fields: [
      { id: "arpu", label: "Average Revenue Per Account/User ($/mo)", type: "number", default: "120" },
      { id: "churnRate", label: "Monthly Churn Rate (%)", type: "number", default: "3.5", step: "0.1" },
      { id: "grossMargin", label: "Gross Margin (%)", type: "number", default: "80", step: "1" }
    ],
    note: "Customer Lifetime Value (LTV) estimates total gross profit generated over an average customer lifespan.",
    compute(v) {
      const arpu = num(v.arpu, "ARPU", { min: 0, allowZero: false });
      const churn = num(v.churnRate, "Churn Rate", { min: 0.01, allowZero: false }) / 100;
      const margin = num(v.grossMargin, "Gross Margin", { min: 0, allowZero: false }) / 100;
      const lifespanMonths = 1 / churn;
      const revenueLtv = arpu * lifespanMonths;
      const profitLtv = revenueLtv * margin;
      return {
        results: [
          { label: "Customer Lifetime Value (Profit LTV)", value: usd(profitLtv), primary: true },
          { label: "Gross Revenue LTV", value: usd(revenueLtv) },
          { label: "Average Lifespan", value: \`\${lifespanMonths.toFixed(1)} months (\${(lifespanMonths / 12).toFixed(1)} yrs)\` }
        ],
        formula: "LTV = (ARPU / Churn Rate) × Gross Margin"
      };
    }
  },

  "cac-payback-calculator": {
    fields: [
      { id: "cac", label: "Customer Acquisition Cost (CAC) ($)", type: "number", default: "1500" },
      { id: "arpu", label: "Monthly Recurring Revenue Per User (MRR) ($)", type: "number", default: "150" },
      { id: "grossMargin", label: "Gross Margin (%)", type: "number", default: "75", step: "1" }
    ],
    note: "Months required for a new customer's gross profit to fully pay back acquisition marketing costs.",
    compute(v) {
      const cac = num(v.cac, "CAC", { min: 1 });
      const arpu = num(v.arpu, "MRR", { min: 1 });
      const margin = num(v.grossMargin, "Gross Margin", { min: 1 }) / 100;
      const monthlyGrossProfit = arpu * margin;
      const paybackMonths = cac / monthlyGrossProfit;
      return {
        results: [
          { label: "CAC Payback Period", value: \`\${paybackMonths.toFixed(1)} months\`, primary: true },
          { label: "Monthly Gross Profit / Customer", value: usd(monthlyGrossProfit) },
          { label: "Annual Gross Margin Return", value: pct((monthlyGrossProfit * 12 / cac) * 100) }
        ],
        formula: "Payback Months = CAC / (Monthly ARPU × Gross Margin %)"
      };
    }
  },

  "burn-rate-runway-calculator": {
    fields: [
      { id: "cashBalance", label: "Current Cash in Bank ($)", type: "number", default: "750000" },
      { id: "monthlyRevenue", label: "Average Monthly Inflow / Revenue ($)", type: "number", default: "35000" },
      { id: "monthlyExpenses", label: "Total Monthly Outflow / Expenses ($)", type: "number", default: "85000" }
    ],
    note: "Evaluates monthly net cash burn and startup survival runway before needing new capital.",
    compute(v) {
      const cash = num(v.cashBalance, "Cash Balance", { min: 0 });
      const rev = num(v.monthlyRevenue, "Monthly Revenue", { min: 0 });
      const exp = num(v.monthlyExpenses, "Monthly Expenses", { min: 0 });
      const netBurn = exp - rev;
      if (netBurn <= 0) {
        return {
          results: [
            { label: "Net Monthly Cash Flow", value: \`+\${usd(Math.abs(netBurn))} (Profitable / Cash Flow Positive)\`, primary: true },
            { label: "Cash Runway", value: "Infinite (Self-sustaining)" }
          ],
          formula: "Net Burn = Monthly Expenses - Monthly Revenue"
        };
      }
      const runwayMonths = cash / netBurn;
      return {
        results: [
          { label: "Cash Runway", value: \`\${runwayMonths.toFixed(1)} months\`, primary: true },
          { label: "Net Monthly Burn Rate", value: usd(netBurn) },
          { label: "Gross Monthly Burn Rate", value: usd(exp) },
          { label: "Zero Cash Date (Est.)", value: \`In ~\${Math.floor(runwayMonths)} months and \${Math.round((runwayMonths % 1) * 30)} days\` }
        ],
        formula: "Runway = Cash Balance / Net Monthly Burn"
      };
    }
  },

  "saas-magic-number": {
    fields: [
      { id: "qRevenueCurrent", label: "Current Quarter Revenue ($)", type: "number", default: "500000" },
      { id: "qRevenuePrior", label: "Prior Quarter Revenue ($)", type: "number", default: "420000" },
      { id: "qSalesMarketing", label: "Prior Quarter Sales & Marketing Expense ($)", type: "number", default: "250000" }
    ],
    note: "Measures sales efficiency: >1.0 indicates rapid, capital-efficient growth; 0.75-1.0 is healthy; <0.75 requires efficiency fixes.",
    compute(v) {
      const qCurr = num(v.qRevenueCurrent, "Current Quarter Revenue", { min: 0 });
      const qPrior = num(v.qRevenuePrior, "Prior Quarter Revenue", { min: 0 });
      const sm = num(v.qSalesMarketing, "Sales & Marketing", { min: 1, allowZero: false });
      const magicNumber = ((qCurr - qPrior) * 4) / sm;
      let rating = "Needs Improvement (<0.75)";
      if (magicNumber >= 1.0) rating = "Outstanding Sales Efficiency (≥1.0 - Pour on the gas)";
      else if (magicNumber >= 0.75) rating = "Healthy Growth (0.75 - 1.0 - Scale carefully)";
      return {
        results: [
          { label: "SaaS Magic Number", value: magicNumber.toFixed(2), primary: true },
          { label: "Efficiency Assessment", value: rating },
          { label: "Net New Annualized Run-Rate", value: usd((qCurr - qPrior) * 4) }
        ],
        formula: "Magic Number = [(Q_t Rev - Q_{t-1} Rev) × 4] / Q_{t-1} S&M Spend"
      };
    }
  },

  "net-promoter-score": {
    fields: [
      { id: "promoters", label: "Promoters Count (Rating 9-10)", type: "number", default: "145" },
      { id: "passives", label: "Passives Count (Rating 7-8)", type: "number", default: "42" },
      { id: "detractors", label: "Detractors Count (Rating 0-6)", type: "number", default: "18" }
    ],
    note: "NPS ranges from -100 to +100. Benchmarks: >0 is good, >50 is excellent, >70 is world-class.",
    compute(v) {
      const p = num(v.promoters, "Promoters", { min: 0 });
      const pas = num(v.passives, "Passives", { min: 0 });
      const d = num(v.detractors, "Detractors", { min: 0 });
      const total = p + pas + d;
      if (total === 0) throw new Error("Total respondents must be greater than zero.");
      const pPct = (p / total) * 100;
      const dPct = (d / total) * 100;
      const nps = Math.round(pPct - dPct);
      return {
        results: [
          { label: "Net Promoter Score (NPS)", value: \`\${nps > 0 ? "+" : ""}\${nps}\`, primary: true },
          { label: "% Promoters", value: pct(pPct) },
          { label: "% Detractors", value: pct(dPct) },
          { label: "% Passives", value: pct((pas / total) * 100) },
          { label: "Total Respondents", value: total.toLocaleString() }
        ],
        formula: "NPS = % Promoters (9-10) - % Detractors (0-6)"
      };
    }
  },

  "ebitda-calculator": {
    fields: [
      { id: "netIncome", label: "Net Income / Profit ($)", type: "number", default: "280000" },
      { id: "interest", label: "Interest Expense ($)", type: "number", default: "35000" },
      { id: "taxes", label: "Income Taxes Paid ($)", type: "number", default: "65000" },
      { id: "depreciation", label: "Depreciation Expense ($)", type: "number", default: "45000" },
      { id: "amortization", label: "Amortization Expense ($)", type: "number", default: "15000" }
    ],
    note: "EBITDA measures core operating profitability before non-operating and non-cash financing items.",
    compute(v) {
      const net = num(v.netIncome, "Net Income");
      const i = num(v.interest, "Interest", { min: 0 });
      const t = num(v.taxes, "Taxes", { min: 0 });
      const d = num(v.depreciation, "Depreciation", { min: 0 });
      const a = num(v.amortization, "Amortization", { min: 0 });
      const ebit = net + i + t;
      const ebitda = ebit + d + a;
      return {
        results: [
          { label: "EBITDA", value: usd(ebitda), primary: true },
          { label: "EBIT (Operating Income)", value: usd(ebit) },
          { label: "Total Non-Cash (D&A)", value: usd(d + a) }
        ],
        formula: "EBITDA = Net Income + Interest + Taxes + Depreciation + Amortization"
      };
    }
  },

  "breakeven-calculator": {
    fields: [
      { id: "fixedCosts", label: "Total Fixed Costs ($)", type: "number", default: "25000" },
      { id: "pricePerUnit", label: "Sales Price Per Unit ($)", type: "number", default: "85" },
      { id: "costPerUnit", label: "Variable Cost Per Unit ($)", type: "number", default: "35" }
    ],
    note: "Calculates the exact number of units and sales revenue needed to cover all expenses.",
    compute(v) {
      const fc = num(v.fixedCosts, "Fixed Costs", { min: 0 });
      const price = num(v.pricePerUnit, "Price Per Unit", { min: 0.01, allowZero: false });
      const vc = num(v.costPerUnit, "Variable Cost Per Unit", { min: 0 });
      if (price <= vc) throw new Error("Price per unit must be greater than variable cost per unit.");
      const contributionMargin = price - vc;
      const cmRatio = contributionMargin / price;
      const units = Math.ceil(fc / contributionMargin);
      const revenue = units * price;
      return {
        results: [
          { label: "Break-Even Units", value: \`\${units.toLocaleString()} units\`, primary: true },
          { label: "Break-Even Sales Revenue", value: usd(revenue) },
          { label: "Unit Contribution Margin", value: usd(contributionMargin) },
          { label: "Contribution Margin Ratio", value: pct(cmRatio * 100) }
        ],
        formula: "Break-Even Units = Fixed Costs / (Unit Price - Unit Variable Cost)"
      };
    }
  },

  "gross-margin-markup": {
    fields: [
      { id: "cost", label: "Cost of Goods (Cost Price) ($)", type: "number", default: "40" },
      { id: "sellingPrice", label: "Selling Price ($)", type: "number", default: "100" }
    ],
    note: "Clear side-by-side comparison between Profit Margin (based on selling price) and Markup (based on cost).",
    compute(v) {
      const cost = num(v.cost, "Cost", { min: 0.01, allowZero: false });
      const price = num(v.sellingPrice, "Selling Price", { min: 0.01, allowZero: false });
      const profit = price - cost;
      const marginPct = (profit / price) * 100;
      const markupPct = (profit / cost) * 100;
      return {
        results: [
          { label: "Gross Profit Margin", value: pct(marginPct), primary: true },
          { label: "Markup Percentage", value: pct(markupPct) },
          { label: "Gross Profit per Unit", value: usd(profit) }
        ],
        formula: "Margin = (Price - Cost)/Price | Markup = (Price - Cost)/Cost"
      };
    }
  },

  "ecommerce-roas-target": {
    fields: [
      { id: "sellingPrice", label: "Average Product Selling Price ($)", type: "number", default: "120" },
      { id: "cogs", label: "Cost of Goods Sold (COGS) ($)", type: "number", default: "36" },
      { id: "shippingFulfillment", label: "Shipping & Pick/Pack Cost ($)", type: "number", default: "14" },
      { id: "merchantFeePercent", label: "Merchant Processing Fee (%)", type: "number", default: "3.0", step: "0.1" }
    ],
    note: "Calculates your exact Break-Even ROAS and Maximum Allowable CPA for paid digital advertising.",
    compute(v) {
      const price = num(v.sellingPrice, "Selling Price", { min: 1 });
      const cogs = num(v.cogs, "COGS", { min: 0 });
      const ship = num(v.shippingFulfillment, "Shipping", { min: 0 });
      const fee = (num(v.merchantFeePercent, "Fee %", { min: 0 }) / 100) * price;
      const totalUnitCost = cogs + ship + fee;
      const maxCpa = price - totalUnitCost;
      if (maxCpa <= 0) throw new Error("Unit costs exceed selling price. No profit margin available for ads.");
      const breakEvenRoas = price / maxCpa;
      return {
        results: [
          { label: "Break-Even Target ROAS", value: \`\${breakEvenRoas.toFixed(2)}x (\${pct(breakEvenRoas * 100)})\`, primary: true },
          { label: "Maximum Allowable CPA (Ad Cost)", value: usd(maxCpa) },
          { label: "Pre-Ad Contribution Profit", value: usd(maxCpa) },
          { label: "Gross Margin Before Ads", value: pct((maxCpa / price) * 100) }
        ],
        formula: "Break-Even ROAS = Selling Price / (Selling Price - Total Unit Costs)"
      };
    }
  },

  "price-elasticity-demand": {
    fields: [
      { id: "p1", label: "Initial Price ($)", type: "number", default: "50" },
      { id: "p2", label: "New Price ($)", type: "number", default: "60" },
      { id: "q1", label: "Initial Quantity Sold", type: "number", default: "1000" },
      { id: "q2", label: "New Quantity Sold", type: "number", default: "850" }
    ],
    note: "Uses the midpoint formula to determine if demand is Elastic (|PED| > 1), Inelastic (|PED| < 1), or Unit Elastic (|PED| = 1).",
    compute(v) {
      const p1 = num(v.p1, "Initial Price", { min: 0.01, allowZero: false });
      const p2 = num(v.p2, "New Price", { min: 0.01, allowZero: false });
      const q1 = num(v.q1, "Initial Quantity", { min: 0.01, allowZero: false });
      const q2 = num(v.q2, "New Quantity", { min: 0.01, allowZero: false });
      const pctPrice = (p2 - p1) / ((p1 + p2) / 2);
      const pctQty = (q2 - q1) / ((q1 + q2) / 2);
      const ped = pctQty / pctPrice;
      const absPed = Math.abs(ped);
      let classification = "Inelastic (|PED| < 1) - Revenue rises with price increase";
      if (absPed > 1.0) classification = "Elastic (|PED| > 1) - Revenue falls with price increase";
      else if (Math.abs(absPed - 1.0) < 0.05) classification = "Unitary Elastic (|PED| ≈ 1)";
      const rev1 = p1 * q1;
      const rev2 = p2 * q2;
      return {
        results: [
          { label: "Price Elasticity of Demand (PED)", value: ped.toFixed(3), primary: true },
          { label: "Demand Elasticity Type", value: classification },
          { label: "Old Revenue vs New Revenue", value: \`\${usd(rev1)} → \${usd(rev2)} (\${rev2 >= rev1 ? "+" : ""}\${usd(rev2 - rev1)})\` }
        ],
        formula: "PED = [(Q2 - Q1)/Midpoint Q] / [(P2 - P1)/Midpoint P]"
      };
    }
  },

  "inventory-reorder-point": {
    fields: [
      { id: "dailyDemand", label: "Average Daily Unit Sales", type: "number", default: "45" },
      { id: "leadTimeDays", label: "Supplier Lead Time (Days)", type: "number", default: "21" },
      { id: "maxDailyDemand", label: "Max Daily Unit Sales (Peak)", type: "number", default: "70" },
      { id: "maxLeadTimeDays", label: "Max Supplier Lead Time (Days)", type: "number", default: "30" }
    ],
    note: "Calculates the exact inventory threshold to trigger purchase orders avoiding stockouts.",
    compute(v) {
      const avgDemand = num(v.dailyDemand, "Average Daily Sales", { min: 0 });
      const leadTime = num(v.leadTimeDays, "Lead Time Days", { min: 1 });
      const maxDemand = num(v.maxDailyDemand, "Max Daily Sales", { min: avgDemand });
      const maxLead = num(v.maxLeadTimeDays, "Max Lead Time Days", { min: leadTime });
      const leadTimeDemand = avgDemand * leadTime;
      const safetyStock = (maxDemand * maxLead) - leadTimeDemand;
      const rop = Math.ceil(leadTimeDemand + Math.max(0, safetyStock));
      return {
        results: [
          { label: "Reorder Point (ROP)", value: \`\${rop.toLocaleString()} units\`, primary: true },
          { label: "Recommended Safety Stock", value: \`\${Math.ceil(safetyStock).toLocaleString()} units\` },
          { label: "Lead Time Demand", value: \`\${Math.ceil(leadTimeDemand).toLocaleString()} units\` }
        ],
        formula: "ROP = (Average Daily Demand × Lead Time) + Safety Stock"
      };
    }
  },

  "quick-ratio-calculator": {
    fields: [
      { id: "cash", label: "Cash & Cash Equivalents ($)", type: "number", default: "150000" },
      { id: "securities", label: "Marketable Securities ($)", type: "number", default: "50000" },
      { id: "receivables", label: "Accounts Receivable ($)", type: "number", default: "120000" },
      { id: "liabilities", label: "Current Liabilities ($)", type: "number", default: "180000" }
    ],
    note: "Acid-Test Ratio measures immediate short-term liquidity without relying on inventory liquidations.",
    compute(v) {
      const cash = num(v.cash, "Cash", { min: 0 });
      const sec = num(v.securities, "Securities", { min: 0 });
      const ar = num(v.receivables, "Accounts Receivable", { min: 0 });
      const liab = num(v.liabilities, "Current Liabilities", { min: 1, allowZero: false });
      const quickAssets = cash + sec + ar;
      const ratio = quickAssets / liab;
      return {
        results: [
          { label: "Quick Ratio (Acid Test)", value: \`\${ratio.toFixed(2)}x\`, primary: true },
          { label: "Status", value: ratio >= 1.0 ? "Strong Liquidity (≥1.0x covers immediate obligations)" : "Tight Liquidity (<1.0x)" },
          { label: "Total Quick Assets", value: usd(quickAssets) }
        ],
        formula: "Quick Ratio = (Cash + Securities + Accounts Receivable) / Current Liabilities"
      };
    }
  },

  "roe-calculator": {
    fields: [
      { id: "netIncome", label: "Net Annual Income ($)", type: "number", default: "320000" },
      { id: "equity", label: "Total Shareholder's Equity ($)", type: "number", default: "1600000" }
    ],
    note: "Measures profitability from stockholders' investments. High ROE signifies capital-efficient compounding.",
    compute(v) {
      const net = num(v.netIncome, "Net Income");
      const eq = num(v.equity, "Shareholder's Equity", { min: 1, allowZero: false });
      const roe = (net / eq) * 100;
      return {
        results: [
          { label: "Return on Equity (ROE)", value: pct(roe), primary: true },
          { label: "Capital Efficiency", value: roe >= 15 ? "High Quality (ROE ≥ 15%)" : "Moderate or Low Capital Return" }
        ],
        formula: "ROE = Net Income / Shareholder's Equity"
      };
    }
  },

  "roa-calculator": {
    fields: [
      { id: "netIncome", label: "Net Annual Income ($)", type: "number", default: "210000" },
      { id: "totalAssets", label: "Total Company Assets ($)", type: "number", default: "2800000" }
    ],
    note: "Measures how efficiently management utilizes company assets to generate net profits.",
    compute(v) {
      const net = num(v.netIncome, "Net Income");
      const assets = num(v.totalAssets, "Total Assets", { min: 1, allowZero: false });
      const roa = (net / assets) * 100;
      return {
        results: [
          { label: "Return on Assets (ROA)", value: pct(roa), primary: true },
          { label: "Asset Productivity", value: roa >= 10 ? "Excellent Asset Efficiency (≥10%)" : "Capital-Intensive Asset Profile" }
        ],
        formula: "ROA = Net Income / Total Assets"
      };
    }
  },

  "dupont-analysis-calculator": {
    fields: [
      { id: "netIncome", label: "Net Income ($)", type: "number", default: "180000" },
      { id: "revenue", label: "Total Revenue ($)", type: "number", default: "2400000" },
      { id: "totalAssets", label: "Total Assets ($)", type: "number", default: "1500000" },
      { id: "equity", label: "Shareholder's Equity ($)", type: "number", default: "900000" }
    ],
    note: "Deconstructs ROE into 3 distinct drivers: Operating Efficiency, Asset Productivity, and Financial Leverage.",
    compute(v) {
      const net = num(v.netIncome, "Net Income");
      const rev = num(v.revenue, "Revenue", { min: 1, allowZero: false });
      const assets = num(v.totalAssets, "Total Assets", { min: 1, allowZero: false });
      const eq = num(v.equity, "Shareholder's Equity", { min: 1, allowZero: false });
      const netMargin = (net / rev) * 100;
      const assetTurnover = rev / assets;
      const leverage = assets / eq;
      const roe = (net / eq) * 100;
      return {
        results: [
          { label: "DuPont Return on Equity (ROE)", value: pct(roe), primary: true },
          { label: "1. Net Profit Margin", value: pct(netMargin) },
          { label: "2. Asset Turnover", value: \`\${assetTurnover.toFixed(2)}x\` },
          { label: "3. Financial Leverage Multiplier", value: \`\${leverage.toFixed(2)}x\` }
        ],
        formula: "ROE = Net Margin × Asset Turnover × Equity Multiplier"
      };
    }
  },

  "ar-turnover-calculator": {
    fields: [
      { id: "netCreditSales", label: "Annual Net Credit Sales ($)", type: "number", default: "1200000" },
      { id: "avgAr", label: "Average Accounts Receivable ($)", type: "number", default: "100000" }
    ],
    note: "Evaluates collection efficiency and Days Sales Outstanding (DSO) for trade receivables.",
    compute(v) {
      const sales = num(v.netCreditSales, "Net Credit Sales", { min: 1, allowZero: false });
      const ar = num(v.avgAr, "Average Accounts Receivable", { min: 1, allowZero: false });
      const turnover = sales / ar;
      const dso = 365 / turnover;
      return {
        results: [
          { label: "AR Turnover Ratio", value: \`\${turnover.toFixed(2)} times/year\`, primary: true },
          { label: "Days Sales Outstanding (DSO)", value: \`\${Math.round(dso)} days\` }
        ],
        formula: "AR Turnover = Credit Sales / Avg AR | DSO = 365 / Turnover"
      };
    }
  },

  "ap-turnover-calculator": {
    fields: [
      { id: "purchases", label: "Total Annual Supplier Purchases / COGS ($)", type: "number", default: "850000" },
      { id: "avgAp", label: "Average Accounts Payable ($)", type: "number", default: "75000" }
    ],
    note: "Evaluates cash outflow timing and Days Payable Outstanding (DPO).",
    compute(v) {
      const purchases = num(v.purchases, "Total Purchases", { min: 1, allowZero: false });
      const ap = num(v.avgAp, "Average Accounts Payable", { min: 1, allowZero: false });
      const turnover = purchases / ap;
      const dpo = 365 / turnover;
      return {
        results: [
          { label: "AP Turnover Ratio", value: \`\${turnover.toFixed(2)} times/year\`, primary: true },
          { label: "Days Payable Outstanding (DPO)", value: \`\${Math.round(dpo)} days\` }
        ],
        formula: "AP Turnover = Purchases / Avg AP | DPO = 365 / Turnover"
      };
    }
  },

  "employee-turnover-cost": {
    fields: [
      { id: "salary", label: "Average Annual Base Salary ($)", type: "number", default: "85000" },
      { id: "departures", label: "Number of Departures / Resignations", type: "number", default: "5" },
      { id: "costPercent", label: "Turnover Cost % of Salary (Industry standard 33% - 150%)", type: "number", default: "50", step: "5" }
    ],
    note: "Quantifies hidden costs of recruiting, interviewing, lost institutional knowledge, onboarding, and ramp-up lag.",
    compute(v) {
      const salary = num(v.salary, "Salary", { min: 1 });
      const deps = num(v.departures, "Departures", { min: 1 });
      const pctCost = num(v.costPercent, "Cost %", { min: 5 }) / 100;
      const costPerEmployee = salary * pctCost;
      const totalCost = costPerEmployee * deps;
      return {
        results: [
          { label: "Total Organizational Turnover Cost", value: usd(totalCost), primary: true },
          { label: "Cost Per Departing Employee", value: usd(costPerEmployee) }
        ],
        formula: "Turnover Cost = Departures × (Annual Salary × Turnover Factor %)"
      };
    }
  },

  "saas-churn-retention": {
    fields: [
      { id: "startCustomers", label: "Customers at Start of Period", type: "number", default: "1250" },
      { id: "lostCustomers", label: "Customers Lost / Churned during Period", type: "number", default: "45" }
    ],
    note: "Customer Retention and Churn rate over any specified tracking period (monthly, quarterly, or annual).",
    compute(v) {
      const start = num(v.startCustomers, "Start Customers", { min: 1, allowZero: false });
      const lost = num(v.lostCustomers, "Lost Customers", { min: 0 });
      if (lost > start) throw new Error("Lost customers cannot exceed starting customer count.");
      const churnRate = (lost / start) * 100;
      const retentionRate = 100 - churnRate;
      return {
        results: [
          { label: "Customer Retention Rate", value: pct(retentionRate), primary: true },
          { label: "Customer Churn Rate", value: pct(churnRate) },
          { label: "Implied Customer Lifespan", value: churnRate > 0 ? \`\${(100 / churnRate).toFixed(1)} periods\` : "Infinite" }
        ],
        formula: "Retention = 100% - (Lost / Starting Customers) × 100"
      };
    }
  },

  "dscr-calculator": {
    fields: [
      { id: "noi", label: "Net Operating Income (Annual NOI) ($)", type: "number", default: "240000" },
      { id: "debtService", label: "Annual Total Debt Service (P&I) ($)", type: "number", default: "185000" }
    ],
    note: "Banks typically require DSCR ≥ 1.25x for commercial real estate and SBA business loans.",
    compute(v) {
      const noi = num(v.noi, "NOI", { min: 0 });
      const debt = num(v.debtService, "Debt Service", { min: 1, allowZero: false });
      const dscr = noi / debt;
      return {
        results: [
          { label: "Debt Service Coverage Ratio (DSCR)", value: \`\${dscr.toFixed(2)}x\`, primary: true },
          { label: "Lender Underwriting Status", value: dscr >= 1.25 ? "Qualifies for Financing (≥ 1.25x)" : "Undercollateralized / High Risk (< 1.25x)" },
          { label: "Net Cash Flow After Debt Service", value: usd(noi - debt) }
        ],
        formula: "DSCR = Annual Net Operating Income / Annual Debt Service"
      };
    }
  },

  "operating-cash-flow": {
    fields: [
      { id: "netIncome", label: "Net Income ($)", type: "number", default: "195000" },
      { id: "nonCashExpenses", label: "Depreciation & Non-Cash Adjustments ($)", type: "number", default: "42000" },
      { id: "workingCapitalChange", label: "Increase in Working Capital ($) (Negative if decrease)", type: "number", default: "18000" }
    ],
    note: "Operating Cash Flow (OCF) tracks true cash generated from primary business activities.",
    compute(v) {
      const net = num(v.netIncome, "Net Income");
      const nonCash = num(v.nonCashExpenses, "Non-Cash Expenses", { min: 0 });
      const deltaWc = num(v.workingCapitalChange, "Working Capital Change");
      const ocf = net + nonCash - deltaWc;
      return {
        results: [
          { label: "Operating Cash Flow (OCF)", value: usd(ocf), primary: true },
          { label: "Cash Flow to Net Income Ratio", value: \`\${(ocf / Math.max(1, net)).toFixed(2)}x\` }
        ],
        formula: "OCF = Net Income + Non-Cash Adjustments - Δ Working Capital"
      };
    }
  },

  "eoq-calculator": {
    fields: [
      { id: "annualDemand", label: "Annual Demand (Units)", type: "number", default: "10000" },
      { id: "orderCost", label: "Fixed Cost Per Order (Setup/Shipping) ($)", type: "number", default: "75" },
      { id: "holdingCost", label: "Annual Holding Cost Per Unit ($)", type: "number", default: "4.50", step: "0.1" }
    ],
    note: "Economic Order Quantity (EOQ) minimizes the sum of inventory ordering and holding costs.",
    compute(v) {
      const d = num(v.annualDemand, "Annual Demand", { min: 1, allowZero: false });
      const s = num(v.orderCost, "Order Cost", { min: 0.01, allowZero: false });
      const h = num(v.holdingCost, "Holding Cost", { min: 0.01, allowZero: false });
      const eoq = Math.round(Math.sqrt((2 * d * s) / h));
      const ordersPerYear = d / eoq;
      const totalCost = (ordersPerYear * s) + ((eoq / 2) * h);
      return {
        results: [
          { label: "Optimal Order Quantity (EOQ)", value: \`\${eoq.toLocaleString()} units\`, primary: true },
          { label: "Recommended Orders Per Year", value: \`\${ordersPerYear.toFixed(1)} orders\` },
          { label: "Total Annual Inventory Cost", value: usd(totalCost) }
        ],
        formula: "EOQ = √[(2 × Demand × Order Cost) / Holding Cost]"
      };
    }
  },

  "cogs-calculator": {
    fields: [
      { id: "beginningInventory", label: "Beginning Inventory ($)", type: "number", default: "85000" },
      { id: "purchases", label: "Inventory Purchases & Freight ($)", type: "number", default: "340000" },
      { id: "directLabor", label: "Direct Labor / Manufacturing Costs ($)", type: "number", default: "95000" },
      { id: "endingInventory", label: "Ending Inventory ($)", type: "number", default: "110000" }
    ],
    note: "GAAP / IRS standard calculation for Cost of Goods Sold.",
    compute(v) {
      const beg = num(v.beginningInventory, "Beginning Inventory", { min: 0 });
      const purchases = num(v.purchases, "Purchases", { min: 0 });
      const labor = num(v.directLabor, "Direct Labor", { min: 0 });
      const ending = num(v.endingInventory, "Ending Inventory", { min: 0 });
      const cogs = beg + purchases + labor - ending;
      return {
        results: [
          { label: "Cost of Goods Sold (COGS)", value: usd(cogs), primary: true },
          { label: "Goods Available for Sale", value: usd(beg + purchases + labor) }
        ],
        formula: "COGS = Beginning Inventory + Additions - Ending Inventory"
      };
    }
  },

  "retail-open-to-buy": {
    fields: [
      { id: "plannedSales", label: "Planned Sales for Month ($)", type: "number", default: "150000" },
      { id: "plannedMarkdowns", label: "Planned Markdowns / Discounts ($)", type: "number", default: "12000" },
      { id: "plannedEndingInv", label: "Target Ending Inventory ($)", type: "number", default: "220000" },
      { id: "beginningInv", label: "Current Beginning Inventory ($)", type: "number", default: "180000" },
      { id: "onOrder", label: "Inventory Already On-Order ($)", type: "number", default: "40000" }
    ],
    note: "Open-To-Buy (OTB) prevents retail over-purchasing and optimizes seasonal stock levels.",
    compute(v) {
      const sales = num(v.plannedSales, "Planned Sales", { min: 0 });
      const md = num(v.plannedMarkdowns, "Markdowns", { min: 0 });
      const endInv = num(v.plannedEndingInv, "Ending Inventory", { min: 0 });
      const begInv = num(v.beginningInv, "Beginning Inventory", { min: 0 });
      const onOrder = num(v.onOrder, "On-Order", { min: 0 });
      const otb = (sales + md + endInv) - (begInv + onOrder);
      return {
        results: [
          { label: "Open-To-Buy Budget (OTB)", value: usd(otb), primary: true },
          { label: "Total Planned Inventory Need", value: usd(sales + md + endInv) },
          { label: "Existing & Committed Inventory", value: usd(begInv + onOrder) }
        ],
        formula: "OTB = (Planned Sales + Markdowns + Target Ending Inv) - (Beginning Inv + On Order)"
      };
    }
  },

  "aov-boost-calculator": {
    fields: [
      { id: "monthlyOrders", label: "Current Monthly Orders Count", type: "number", default: "2500" },
      { id: "currentAov", label: "Current Average Order Value (AOV) ($)", type: "number", default: "65" },
      { id: "targetAov", label: "Target AOV (Post-upsell/bundle) ($)", type: "number", default: "78" }
    ],
    note: "Calculates monthly and annualized net new revenue unlocked by lifting cart checkout sizes.",
    compute(v) {
      const orders = num(v.monthlyOrders, "Monthly Orders", { min: 1 });
      const curAov = num(v.currentAov, "Current AOV", { min: 1 });
      const tgtAov = num(v.targetAov, "Target AOV", { min: curAov });
      const currentRev = orders * curAov;
      const targetRev = orders * tgtAov;
      const monthlyLift = targetRev - currentRev;
      return {
        results: [
          { label: "Monthly Revenue Lift", value: \`+\${usd(monthlyLift)}\`, primary: true },
          { label: "Annualized Incremental Revenue", value: \`+\${usd(monthlyLift * 12)}\` },
          { label: "Percentage AOV Increase", value: pct(((tgtAov - curAov) / curAov) * 100) }
        ],
        formula: "Revenue Lift = Orders × (Target AOV - Current AOV)"
      };
    }
  },

  "profit-margin-target": {
    fields: [
      { id: "cost", label: "Product Cost / Delivery Cost ($)", type: "number", default: "65" },
      { id: "desiredMargin", label: "Desired Profit Margin (%)", type: "number", default: "60", step: "1" }
    ],
    note: "Calculates the exact selling price required to achieve your target gross margin percentage.",
    compute(v) {
      const cost = num(v.cost, "Cost", { min: 0.01, allowZero: false });
      const margin = num(v.desiredMargin, "Desired Margin", { min: 1, allowZero: false });
      if (margin >= 100) throw new Error("Desired profit margin must be strictly less than 100%.");
      const targetPrice = cost / (1 - (margin / 100));
      const profit = targetPrice - cost;
      const markup = (profit / cost) * 100;
      return {
        results: [
          { label: "Target Selling Price", value: usd(targetPrice), primary: true },
          { label: "Gross Profit Per Unit", value: usd(profit) },
          { label: "Equivalent Markup %", value: pct(markup) }
        ],
        formula: "Target Price = Cost / (1 - Desired Margin %)"
      };
    }
  },

  "blended-cac-calculator": {
    fields: [
      { id: "paidSpend", label: "Total Paid Marketing Spend ($)", type: "number", default: "45000" },
      { id: "paidAcquisitions", label: "Customers Acquired via Paid Ads", type: "number", default: "220" },
      { id: "organicAcquisitions", label: "Customers Acquired via Organic/Referrals", type: "number", default: "180" }
    ],
    note: "Compares Paid CAC against Blended CAC across all acquisition channels.",
    compute(v) {
      const spend = num(v.paidSpend, "Paid Spend", { min: 0 });
      const paidCust = num(v.paidAcquisitions, "Paid Customers", { min: 1, allowZero: false });
      const orgCust = num(v.organicAcquisitions, "Organic Customers", { min: 0 });
      const totalCust = paidCust + orgCust;
      const paidCac = spend / paidCust;
      const blendedCac = spend / totalCust;
      return {
        results: [
          { label: "Blended CAC", value: usd(blendedCac), primary: true },
          { label: "Paid-Only CAC", value: usd(paidCac) },
          { label: "Organic Customer Boost", value: \`\${pct((orgCust / totalCust) * 100)} of total growth\` }
        ],
        formula: "Blended CAC = Total Paid Spend / Total New Customers"
      };
    }
  },

  "mrr-to-arr-calculator": {
    fields: [
      { id: "mrr", label: "Current Monthly Recurring Revenue (MRR) ($)", type: "number", default: "85000" },
      { id: "growthRate", label: "Monthly Growth Rate (%)", type: "number", default: "5.5", step: "0.1" }
    ],
    note: "Calculates Annualized Run Rate (ARR) and project 12-month forward compounded ARR.",
    compute(v) {
      const mrr = num(v.mrr, "MRR", { min: 0 });
      const g = num(v.growthRate, "Growth Rate", { min: -100 }) / 100;
      const staticArr = mrr * 12;
      let compoundedRev = 0;
      let projectedMrr = mrr;
      for (let i = 0; i < 12; i++) {
        projectedMrr *= (1 + g);
        compoundedRev += projectedMrr;
      }
      return {
        results: [
          { label: "Current ARR (Run-Rate)", value: usd(staticArr), primary: true },
          { label: "Projected 12-Month Exit ARR", value: usd(projectedMrr * 12) },
          { label: "Total 12-Month Projected Collections", value: usd(compoundedRev) }
        ],
        formula: "ARR = MRR × 12 | Compound ARR = MRR × (1 + g)^12 × 12"
      };
    }
  },

  "saas-rule-of-40": {
    fields: [
      { id: "growthRate", label: "Year-Over-Year Revenue Growth Rate (%)", type: "number", default: "32", step: "0.1" },
      { id: "profitMargin", label: "Free Cash Flow Margin / EBITDA Margin (%)", type: "number", default: "14", step: "0.1" }
    ],
    note: "Venture benchmark for software companies: Growth % + Profit Margin % should equal or exceed 40%.",
    compute(v) {
      const g = num(v.growthRate, "Growth Rate");
      const p = num(v.profitMargin, "Profit Margin");
      const score = g + p;
      return {
        results: [
          { label: "Rule of 40 Score", value: \`\${score.toFixed(1)}%\`, primary: true },
          { label: "Evaluation", value: score >= 40 ? "Passes Rule of 40 (Elite SaaS Profile)" : "Below 40% Threshold (Balance growth vs profitability)" }
        ],
        formula: "Score = YoY Growth Rate (%) + Margin (%)"
      };
    }
  },

  "freelance-hourly-rate": {
    fields: [
      { id: "targetIncome", label: "Target Annual Take-Home Income ($)", type: "number", default: "120000" },
      { id: "businessExpenses", label: "Annual Business Expenses & Software ($)", type: "number", default: "15000" },
      { id: "taxRate", label: "Estimated Self-Employment & Income Tax Rate (%)", type: "number", default: "28", step: "1" },
      { id: "billableHoursPerWeek", label: "Realistic Billable Hours / Week (Avg 20-30)", type: "number", default: "25" },
      { id: "vacationWeeks", label: "Weeks of Time Off / Holidays Per Year", type: "number", default: "4" }
    ],
    note: "Calculates the billable hourly rate required to hit target earnings after taxes, expenses, and downtime.",
    compute(v) {
      const takeHome = num(v.targetIncome, "Target Income", { min: 1 });
      const exp = num(v.businessExpenses, "Expenses", { min: 0 });
      const tax = num(v.taxRate, "Tax Rate", { min: 0, max: 99 }) / 100;
      const hoursPerWeek = num(v.billableHoursPerWeek, "Billable Hours", { min: 1 });
      const offWeeks = num(v.vacationWeeks, "Weeks Off", { min: 0, max: 50 });
      const workingWeeks = 52 - offWeeks;
      const grossIncomeNeeded = (takeHome / (1 - tax)) + exp;
      const totalBillableHours = workingWeeks * hoursPerWeek;
      const hourlyRate = grossIncomeNeeded / totalBillableHours;
      return {
        results: [
          { label: "Recommended Hourly Rate", value: usd(hourlyRate), primary: true },
          { label: "Gross Annual Revenue Required", value: usd(grossIncomeNeeded) },
          { label: "Annual Billable Hours", value: \`\${totalBillableHours.toLocaleString()} hours\` }
        ],
        formula: "Hourly Rate = [(Net Income / (1 - Tax)) + Expenses] / (Weeks × Billable Hours)"
      };
    }
  }
};
`;

writeFileSync(path.join(root, "src/lib/ops/calc-business.ts"), businessOpsSource, "utf8");
console.log("Wrote src/lib/ops/calc-business.ts (33 ops)");
