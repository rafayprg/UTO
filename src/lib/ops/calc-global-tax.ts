import type { CalcOp } from "./types";

function num(value: string, label: string, { min = -Infinity, max = Infinity, allowZero = true } = {}): number {
  const parsed = Number(String(value).replace(/,/g, "").trim());
  if (value.trim() === "" || !Number.isFinite(parsed)) throw new Error(`Enter a number for ${label}.`);
  if (parsed < min || parsed > max || (!allowZero && parsed === 0)) throw new Error(`${label} must be ${allowZero ? "at least" : "greater than"} ${min}.`);
  return parsed;
}

const usd = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD" });
const gbp = (v: number) => v.toLocaleString("en-GB", { style: "currency", currency: "GBP" });
const cad = (v: number) => v.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
const aud = (v: number) => v.toLocaleString("en-AU", { style: "currency", currency: "AUD" });
const eur = (v: number) => v.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
const inr = (v: number) => v.toLocaleString("en-IN", { style: "currency", currency: "INR" });
const jpy = (v: number) => v.toLocaleString("ja-JP", { style: "currency", currency: "JPY" });
const aed = (v: number) => `${v.toLocaleString("en-US", { maximumFractionDigits: 0 })} AED`;
const pct = (v: number) => `${v.toFixed(2)}%`;

export const globalTaxOps: Record<string, CalcOp> = {
  "uk-income-tax-calculator": {
    fields: [
      { id: "grossSalary", label: "Gross Annual Income (£)", type: "number", default: "55000" }
    ],
    note: "Calculates UK 2025/2026 PAYE Income Tax and Class 1 National Insurance for England, Wales & Northern Ireland.",
    compute(v) {
      const salary = num(v.grossSalary, "Gross Salary", { min: 0 });
      // Personal allowance £12,570, phased out by £1 for every £2 over £100,000
      let personalAllowance = 12570;
      if (salary > 100000) {
        personalAllowance = Math.max(0, 12570 - (salary - 100000) / 2);
      }
      const taxable = Math.max(0, salary - personalAllowance);
      let incomeTax = 0;
      // Basic rate 20% (£12,571 to £50,270)
      const basicBand = Math.min(taxable, 37700);
      incomeTax += basicBand * 0.20;
      // Higher rate 40% (£50,271 to £125,140)
      if (taxable > 37700) {
        const higherBand = Math.min(taxable - 37700, 125140 - 50270);
        incomeTax += higherBand * 0.40;
      }
      // Additional rate 45% (over £125,140)
      if (salary > 125140) {
        incomeTax += (salary - 125140) * 0.45;
      }

      // National Insurance Class 1 (8% from £12,570 to £50,270, 2% above)
      let ni = 0;
      if (salary > 12570) {
        const niMainBand = Math.min(salary - 12570, 50270 - 12570);
        ni += niMainBand * 0.08;
      }
      if (salary > 50270) {
        ni += (salary - 50270) * 0.02;
      }

      const totalDeductions = incomeTax + ni;
      const takeHome = salary - totalDeductions;
      return {
        results: [
          { label: "Net Annual Take-Home Pay", value: gbp(takeHome), primary: true },
          { label: "Net Monthly Pay", value: gbp(takeHome / 12) },
          { label: "Total UK Income Tax (PAYE)", value: gbp(incomeTax) },
          { label: "Class 1 National Insurance", value: gbp(ni) },
          { label: "Effective Tax & NI Rate", value: pct(salary > 0 ? (totalDeductions / salary) * 100 : 0) }
        ],
        formula: "Take-Home = Gross - Income Tax (20%/40%/45%) - National Insurance (8%/2%)"
      };
    }
  },

  "canada-income-tax-calculator": {
    fields: [
      { id: "grossIncome", label: "Gross Annual Income ($CAD)", type: "number", default: "85000" },
      { id: "province", label: "Province of Residence", type: "select", default: "ON", choices: [["ON", "Ontario"], ["BC", "British Columbia"], ["AB", "Alberta"], ["QC", "Quebec"]] }
    ],
    note: "Calculates combined Canada Federal Income Tax, Provincial Income Tax, and statutory CPP/EI contributions.",
    compute(v) {
      const gross = num(v.grossIncome, "Gross Income", { min: 0 });
      // Federal brackets: 15% up to $55,867, 20.5% up to $111,733, 26% up to $173,205, 29% up to $246,752, 33% over
      const fBrackets = [
        { upTo: 55867, rate: 0.15 },
        { upTo: 111733, rate: 0.205 },
        { upTo: 173205, rate: 0.26 },
        { upTo: 246752, rate: 0.29 },
        { upTo: Infinity, rate: 0.33 }
      ];
      let federalTax = 0;
      let prevF = 0;
      for (const b of fBrackets) {
        if (gross > prevF) {
          const chunk = Math.min(gross - prevF, b.upTo - prevF);
          federalTax += chunk * b.rate;
          prevF = b.upTo;
        }
      }
      // Federal basic personal credit ($15,705 * 15% = $2,355.75)
      federalTax = Math.max(0, federalTax - 2355.75);

      // Approximate provincial rates
      let provRate = 0.09;
      if (v.province === "BC") provRate = 0.075;
      else if (v.province === "AB") provRate = 0.10;
      else if (v.province === "QC") provRate = 0.15;
      const provTax = Math.max(0, gross * provRate - 1200);

      // CPP ($3,867 max) + EI ($1,049 max)
      const cpp = Math.min(3867, Math.max(0, (gross - 3500) * 0.0595));
      const ei = Math.min(1049, gross * 0.0166);
      const totalDeductions = federalTax + provTax + cpp + ei;
      const takeHome = gross - totalDeductions;
      return {
        results: [
          { label: "Net Annual Take-Home (CAD)", value: cad(takeHome), primary: true },
          { label: "Net Monthly Pay", value: cad(takeHome / 12) },
          { label: "Federal Income Tax", value: cad(federalTax) },
          { label: "Provincial Income Tax", value: cad(provTax) },
          { label: "CPP & EI Contributions", value: cad(cpp + ei) }
        ],
        formula: "Net = Gross - Federal Tax - Provincial Tax - CPP - EI"
      };
    }
  },

  "australia-income-tax-calculator": {
    fields: [
      { id: "grossIncome", label: "Taxable Annual Income ($AUD)", type: "number", default: "95000" }
    ],
    note: "Calculates Australian ATO individual resident income tax brackets (Stage 3 tax cuts) plus 2% Medicare levy.",
    compute(v) {
      const gross = num(v.grossIncome, "Income", { min: 0 });
      // Stage 3 tax cuts:
      // $0 - $18,200: Nil
      // $18,201 - $45,000: 16%
      // $45,001 - $135,000: 30%
      // $135,001 - $190,000: 37%
      // $190,001+: 45%
      let baseTax = 0;
      if (gross > 18200) baseTax += Math.min(gross - 18200, 45000 - 18200) * 0.16;
      if (gross > 45000) baseTax += Math.min(gross - 45000, 135000 - 45000) * 0.30;
      if (gross > 135000) baseTax += Math.min(gross - 135000, 190000 - 135000) * 0.37;
      if (gross > 190000) baseTax += (gross - 190000) * 0.45;

      const medicareLevy = gross * 0.02;
      const totalTax = baseTax + medicareLevy;
      const takeHome = gross - totalTax;
      return {
        results: [
          { label: "Net Annual Take-Home Pay (AUD)", value: aud(takeHome), primary: true },
          { label: "Net Fortnightly Pay (Every 2 Weeks)", value: aud(takeHome / 26) },
          { label: "ATO Resident Income Tax", value: aud(baseTax) },
          { label: "Medicare Levy (2%)", value: aud(medicareLevy) },
          { label: "Effective Tax Rate", value: pct(gross > 0 ? (totalTax / gross) * 100 : 0) }
        ],
        formula: "Net = Gross - Stage 3 ATO Income Tax - 2% Medicare Levy"
      };
    }
  },

  "germany-income-tax-calculator": {
    fields: [
      { id: "grossSalary", label: "Annual Gross Salary (€)", type: "number", default: "65000" }
    ],
    note: "Calculates German wage tax (Einkommensteuer) Steuerklasse I and statutory social security (Renten-, Kranken-, Pflege-, Arbeitslosenversicherung).",
    compute(v) {
      const gross = num(v.grossSalary, "Gross Salary", { min: 0 });
      // Basic tax-free allowance ~€11,784
      let tax = 0;
      if (gross > 11784) {
        const taxable = gross - 11784;
        tax = taxable * (gross > 66760 ? 0.38 : 0.28);
      }
      // Social contributions total ~20% employee share (Pension 9.3%, Health 7.3%, Care 2.2%, Unemployment 1.3%)
      const socialSec = gross * 0.201;
      const totalDeductions = tax + socialSec;
      const net = gross - totalDeductions;
      return {
        results: [
          { label: "Net Annual Salary (Netto €)", value: eur(net), primary: true },
          { label: "Net Monthly Salary", value: eur(net / 12) },
          { label: "Income Tax (Lohnsteuer)", value: eur(tax) },
          { label: "Social Security Contributions (~20.1%)", value: eur(socialSec) }
        ],
        formula: "Netto = Brutto - Lohnsteuer - Sozialabgaben (~20.1%)"
      };
    }
  },

  "france-income-tax-calculator": {
    fields: [
      { id: "grossSalary", label: "Annual Gross Salary (€)", type: "number", default: "52000" }
    ],
    note: "Calculates French social charges (cotisations sociales salariales ~22%) and progressive income tax (impôt sur le revenu).",
    compute(v) {
      const gross = num(v.grossSalary, "Gross Salary", { min: 0 });
      // Social security charges (~22% employee share)
      const cotisations = gross * 0.22;
      const netImposable = gross - cotisations;
      // 10% professional expense deduction
      const taxableBase = netImposable * 0.90;
      // French progressive brackets (parts = 1): 0% to €11,294, 11% to €28,797, 30% to €82,341
      let ir = 0;
      if (taxableBase > 11294) ir += Math.min(taxableBase - 11294, 28797 - 11294) * 0.11;
      if (taxableBase > 28797) ir += Math.min(taxableBase - 28797, 82341 - 28797) * 0.30;
      const netApresImpot = netImposable - ir;
      return {
        results: [
          { label: "Net Annual Salary (Net Après Impôt)", value: eur(netApresImpot), primary: true },
          { label: "Net Monthly Salary", value: eur(netApresImpot / 12) },
          { label: "Income Tax (Impôt sur le revenu)", value: eur(ir) },
          { label: "Employee Social Charges (~22%)", value: eur(cotisations) }
        ],
        formula: "Net Après Impôt = Brut - Cotisations Salariales - Impôt sur le Revenu"
      };
    }
  },

  "india-income-tax-calculator": {
    fields: [
      { id: "grossIncome", label: "Annual Gross Income (₹ INR)", type: "number", default: "1500000" }
    ],
    note: "Calculates Indian Income Tax under the default New Tax Regime (Section 115BAC with ₹75,000 standard deduction).",
    compute(v) {
      const gross = num(v.grossIncome, "Income", { min: 0 });
      const standardDeduction = 75000;
      const taxable = Math.max(0, gross - standardDeduction);
      // New Tax Regime Slabs:
      // ₹0 - ₹3,00,000: Nil
      // ₹3,00,001 - ₹7,00,000: 5%
      // ₹7,00,001 - ₹10,00,000: 10%
      // ₹10,00,001 - ₹12,00,000: 15%
      // ₹12,00,001 - ₹15,00,000: 20%
      // Above ₹15,00,000: 30%
      let baseTax = 0;
      if (taxable > 300000) baseTax += Math.min(taxable - 300000, 400000) * 0.05;
      if (taxable > 700000) baseTax += Math.min(taxable - 700000, 300000) * 0.10;
      if (taxable > 1000000) baseTax += Math.min(taxable - 1000000, 200000) * 0.15;
      if (taxable > 1200000) baseTax += Math.min(taxable - 1200000, 300000) * 0.20;
      if (taxable > 1500000) baseTax += (taxable - 1500000) * 0.30;

      // Section 87A rebate if taxable income <= ₹7,00,000
      if (taxable <= 700000) baseTax = 0;
      const cess = baseTax * 0.04; // 4% Health & Education Cess
      const totalTax = baseTax + cess;
      const takeHome = gross - totalTax;
      return {
        results: [
          { label: "Net Annual In-Hand Income (₹)", value: inr(takeHome), primary: true },
          { label: "Net Monthly In-Hand Pay", value: inr(takeHome / 12) },
          { label: "Total Income Tax Liability", value: inr(totalTax) },
          { label: "Health & Education Cess (4%)", value: inr(cess) }
        ],
        formula: "Tax = Slabs (5%-30%) + 4% Cess with ₹75k Standard Deduction"
      };
    }
  },

  "japan-income-tax-calculator": {
    fields: [
      { id: "grossSalary", label: "Annual Gross Salary (¥ JPY)", type: "number", default: "8000000" }
    ],
    note: "Calculates Japan National Income Tax (Shotokuzei) plus local 10% Inhabitant Resident Tax (Juminzei).",
    compute(v) {
      const gross = num(v.grossSalary, "Salary", { min: 0 });
      // Employment income deduction
      let empDeduction = 1950000;
      if (gross <= 1800000) empDeduction = gross * 0.40;
      else if (gross <= 3600000) empDeduction = (gross * 0.30) + 180000;
      else if (gross <= 6600000) empDeduction = (gross * 0.20) + 540000;
      else if (gross <= 8500000) empDeduction = (gross * 0.10) + 1200000;
      const taxable = Math.max(0, gross - empDeduction - 480000); // 480k basic deduction
      // Progressive national income tax
      let nationalTax = 0;
      if (taxable <= 1950000) nationalTax = taxable * 0.05;
      else if (taxable <= 3300000) nationalTax = (taxable * 0.10) - 97500;
      else if (taxable <= 6950000) nationalTax = (taxable * 0.20) - 427500;
      else if (taxable <= 8999000) nationalTax = (taxable * 0.23) - 636000;
      else nationalTax = (taxable * 0.33) - 1536000;

      // Reconstruction surtax 2.1%
      nationalTax *= 1.021;
      // Inhabitant tax (flat 10% of taxable income)
      const residentTax = taxable * 0.10;
      // Social insurance (approx 15% employee share)
      const socialIns = gross * 0.15;
      const totalDeductions = nationalTax + residentTax + socialIns;
      const takeHome = gross - totalDeductions;
      return {
        results: [
          { label: "Net Annual Take-Home (Teate ¥)", value: jpy(takeHome), primary: true },
          { label: "Net Monthly Pay", value: jpy(takeHome / 12) },
          { label: "National Income Tax (Shotokuzei)", value: jpy(nationalTax) },
          { label: "Resident Inhabitant Tax (Juminzei 10%)", value: jpy(residentTax) },
          { label: "Social Insurance (~15%)", value: jpy(socialIns) }
        ],
        formula: "Take-Home = Gross - Shotokuzei - Juminzei (10%) - Social Insurance"
      };
    }
  },

  "netherlands-box1-tax": {
    fields: [
      { id: "annualIncome", label: "Gross Taxable Income (€)", type: "number", default: "75000" }
    ],
    note: "Calculates Dutch Box 1 income tax & national insurance (arbeidskorting & algemene heffingskorting).",
    compute(v) {
      const gross = num(v.annualIncome, "Income", { min: 0 });
      // Bracket 1: up to €75,518 at 36.97%
      // Bracket 2: over €75,518 at 49.50%
      let rawTax = 0;
      if (gross <= 75518) {
        rawTax = gross * 0.3697;
      } else {
        rawTax = (75518 * 0.3697) + ((gross - 75518) * 0.4950);
      }
      // General tax credit (Algemene heffingskorting)
      const generalCredit = Math.max(0, 3362 - (gross > 24812 ? (gross - 24812) * 0.0663 : 0));
      // Labour tax credit (Arbeidskorting)
      const labourCredit = Math.max(0, 5532 - (gross > 39957 ? (gross - 39957) * 0.0651 : 0));
      const netTax = Math.max(0, rawTax - generalCredit - labourCredit);
      const netIncome = gross - netTax;
      return {
        results: [
          { label: "Net Annual Income (€)", value: eur(netIncome), primary: true },
          { label: "Net Monthly Income", value: eur(netIncome / 12) },
          { label: "Net Box 1 Tax Due", value: eur(netTax) },
          { label: "Effective Tax Rate", value: pct(gross > 0 ? (netTax / gross) * 100 : 0) }
        ],
        formula: "Net = Gross - [Box 1 Tax (36.97%/49.50%) - Heffingskortingen]"
      };
    }
  },

  "spain-irpf-tax-calculator": {
    fields: [
      { id: "grossSalary", label: "Gross Annual Salary (€)", type: "number", default: "48000" }
    ],
    note: "Calculates Spanish IRPF progressive income tax (State + Regional average) and 6.35% Social Security.",
    compute(v) {
      const gross = num(v.grossSalary, "Salary", { min: 0 });
      // Social security employee share 6.35%
      const ss = gross * 0.0635;
      const base = gross - ss - 5550; // €5,550 personal minimum
      // Approximate combined progressive scale (19% to 47%)
      let irpf = 0;
      if (base > 0) irpf += Math.min(base, 12450) * 0.19;
      if (base > 12450) irpf += Math.min(base - 12450, 20200 - 12450) * 0.24;
      if (base > 20200) irpf += Math.min(base - 20200, 35200 - 20200) * 0.30;
      if (base > 35200) irpf += Math.min(base - 35200, 60000 - 35200) * 0.37;
      if (base > 60000) irpf += (base - 60000) * 0.45;
      const totalTax = irpf + ss;
      const net = gross - totalTax;
      return {
        results: [
          { label: "Net Annual Salary (Sueldo Neto €)", value: eur(net), primary: true },
          { label: "Net Monthly Salary (12 payments)", value: eur(net / 12) },
          { label: "IRPF Income Tax", value: eur(irpf) },
          { label: "Seguridad Social (6.35%)", value: eur(ss) }
        ],
        formula: "Neto = Bruto - IRPF - Seguridad Social (6.35%)"
      };
    }
  },

  "singapore-income-tax-calculator": {
    fields: [
      { id: "chargeableIncome", label: "Annual Chargeable Income ($SGD)", type: "number", default: "120000" }
    ],
    note: "Calculates Singapore IRAS individual tax resident progressive brackets (0% to 24%). Zero capital gains tax.",
    compute(v) {
      const income = num(v.chargeableIncome, "Income", { min: 0 });
      // Slabs:
      // First $20,000: 0%
      // Next $10,000: 2%
      // Next $10,000: 3.5%
      // Next $40,000: 7%
      // Next $40,000: 11.5%
      // Next $40,000: 15%
      // Next $40,000: 18%
      // Next $40,000: 19%
      // Next $40,000: 20%
      // Next $40,000: 22%
      // Over $320,000: 24%
      let tax = 0;
      if (income > 20000) tax += Math.min(income - 20000, 10000) * 0.02;
      if (income > 30000) tax += Math.min(income - 30000, 10000) * 0.035;
      if (income > 40000) tax += Math.min(income - 40000, 40000) * 0.07;
      if (income > 80000) tax += Math.min(income - 80000, 40000) * 0.115;
      if (income > 120000) tax += Math.min(income - 120000, 40000) * 0.15;
      if (income > 160000) tax += Math.min(income - 160000, 40000) * 0.18;
      if (income > 200000) tax += (income - 200000) * 0.20;
      const takeHome = income - tax;
      return {
        results: [
          { label: "Net Annual Take-Home (SGD)", value: `$${takeHome.toLocaleString("en-SG", { maximumFractionDigits: 0 })} SGD`, primary: true },
          { label: "IRAS Personal Income Tax", value: `$${tax.toLocaleString("en-SG", { maximumFractionDigits: 0 })} SGD` },
          { label: "Effective Tax Rate", value: pct(income > 0 ? (tax / income) * 100 : 0) }
        ],
        formula: "IRAS Progressive Resident Scale 0% to 24%"
      };
    }
  },

  "uae-gratuity-calculator": {
    fields: [
      { id: "basicMonthlySalary", label: "Basic Monthly Salary (Excluding allowances) (AED)", type: "number", default: "18000" },
      { id: "yearsOfService", label: "Completed Years of Continuous Service", type: "number", default: "4.5", step: "0.5" },
      { id: "contractType", label: "Contract Status", type: "select", default: "limited", choices: [["limited", "Limited Contract / Modern Law"], ["resignation", "Unlimited Contract (Resignation)"]] }
    ],
    note: "Calculates UAE Labour Law (Federal Decree Law No. 33 of 2021) End of Service Benefits (EOSB).",
    compute(v) {
      const basic = num(v.basicMonthlySalary, "Basic Salary", { min: 500 });
      const years = num(v.yearsOfService, "Years", { min: 1 });
      const dailyWage = basic / 30;
      let totalGratuity = 0;
      if (years <= 5) {
        totalGratuity = years * (dailyWage * 21);
      } else {
        totalGratuity = (5 * (dailyWage * 21)) + ((years - 5) * (dailyWage * 30));
      }
      // Maximum gratuity cannot exceed two years' basic salary
      const cap = basic * 24;
      totalGratuity = Math.min(totalGratuity, cap);
      return {
        results: [
          { label: "Total End of Service Gratuity", value: aed(totalGratuity), primary: true },
          { label: "Daily Wage Rate", value: aed(dailyWage) },
          { label: "Maximum Gratuity Cap (2 Years Basic)", value: aed(cap) }
        ],
        formula: "21 days/yr for first 5 yrs + 30 days/yr thereafter (capped at 2 years salary)"
      };
    }
  },

  "compound-interest-advanced": {
    fields: [
      { id: "principal", label: "Starting Principal ($)", type: "number", default: "15000" },
      { id: "monthlyDeposit", label: "Monthly Recurring Addition ($)", type: "number", default: "500" },
      { id: "annualRate", label: "Annual Interest / Return Rate (%)", type: "number", default: "8.0", step: "0.1" },
      { id: "years", label: "Investment Horizon (Years)", type: "number", default: "25" }
    ],
    note: "Calculates compound growth with regular additions and visualizes principal vs earned interest.",
    compute(v) {
      const p = num(v.principal, "Principal", { min: 0 });
      const pmt = num(v.monthlyDeposit, "Monthly Deposit", { min: 0 });
      const r = (num(v.annualRate, "Annual Rate", { min: 0 }) / 100) / 12;
      const yrs = num(v.years, "Years", { min: 1, max: 60 });
      const n = yrs * 12;
      let balance = p;
      let totalContributions = p;
      for (let i = 0; i < n; i++) {
        balance = (balance + pmt) * (1 + r);
        totalContributions += pmt;
      }
      const totalInterest = balance - totalContributions;
      return {
        results: [
          { label: "Future Portfolio Balance", value: usd(balance), primary: true },
          { label: "Total Interest / Investment Gain", value: usd(totalInterest) },
          { label: "Total Out-of-Pocket Principal Invested", value: usd(totalContributions) },
          { label: "Gain Multiplier", value: `${(balance / Math.max(1, totalContributions)).toFixed(2)}x` }
        ],
        formula: "A = P(1 + r/n)^(nt) + PMT × [((1 + r/n)^(nt) - 1) / (r/n)]"
      };
    }
  },

  "rule-of-72-doubling": {
    fields: [
      { id: "annualRate", label: "Annual Compound Rate of Return (%)", type: "number", default: "7.2", step: "0.1" }
    ],
    note: "Calculates the exact time needed for an investment to double in value.",
    compute(v) {
      const r = num(v.annualRate, "Rate", { min: 0.1, allowZero: false });
      const rule72Years = 72 / r;
      const exactYears = Math.log(2) / Math.log(1 + (r / 100));
      return {
        results: [
          { label: "Doubling Time (Exact)", value: `${exactYears.toFixed(2)} years (${Math.round(exactYears * 12)} months)`, primary: true },
          { label: "Rule of 72 Approximation", value: `${rule72Years.toFixed(2)} years` },
          { label: "Quadrupling Time (4x)", value: `${(exactYears * 2).toFixed(2)} years` }
        ],
        formula: "Exact t = ln(2) / ln(1 + r) | Approx t = 72 / r"
      };
    }
  },

  "dividend-reinvestment-drip": {
    fields: [
      { id: "startingPortfolio", label: "Initial Stock / ETF Investment ($)", type: "number", default: "50000" },
      { id: "dividendYield", label: "Annual Dividend Yield (%)", type: "number", default: "3.8", step: "0.1" },
      { id: "annualDividendGrowth", label: "Dividend Annual Growth Rate (%)", type: "number", default: "6.0", step: "0.1" },
      { id: "years", label: "Reinvestment Horizon (Years)", type: "number", default: "20" }
    ],
    note: "Calculates compounding wealth accumulation from DRIP (Dividend Reinvestment Plan).",
    compute(v) {
      let balance = num(v.startingPortfolio, "Portfolio", { min: 100 });
      let currentYield = num(v.dividendYield, "Dividend Yield", { min: 0.1 }) / 100;
      const divGrowth = num(v.annualDividendGrowth, "Div Growth", { min: 0 }) / 100;
      const yrs = num(v.years, "Years", { min: 1, max: 50 });
      for (let y = 1; y <= yrs; y++) {
        const annualPayout = balance * currentYield;
        balance += annualPayout;
        currentYield *= (1 + divGrowth);
      }
      const exitAnnualIncome = balance * currentYield;
      return {
        results: [
          { label: "Future Portfolio Value via DRIP", value: usd(balance), primary: true },
          { label: "Future Annual Dividend Income", value: usd(exitAnnualIncome) },
          { label: "Future Monthly Passive Cash Flow", value: usd(exitAnnualIncome / 12) }
        ],
        formula: "Compounded DRIP Growth with Dividend Escalator"
      };
    }
  },

  "inflation-purchasing-power": {
    fields: [
      { id: "currentAmount", label: "Today's Dollar Amount ($)", type: "number", default: "100000" },
      { id: "inflationRate", label: "Average Annual Inflation Rate (%)", type: "number", default: "3.2", step: "0.1" },
      { id: "futureYears", label: "Years in the Future", type: "number", default: "20" }
    ],
    note: "Shows how purchasing power erodes over time and how much future money is required to maintain today's lifestyle.",
    compute(v) {
      const amount = num(v.currentAmount, "Amount", { min: 1 });
      const rate = num(v.inflationRate, "Inflation Rate", { min: 0 }) / 100;
      const yrs = num(v.futureYears, "Years", { min: 1, max: 70 });
      const futurePurchasingPower = amount / Math.pow(1 + rate, yrs);
      const equivalentFutureAmount = amount * Math.pow(1 + rate, yrs);
      const purchasingPowerLoss = ((amount - futurePurchasingPower) / amount) * 100;
      return {
        results: [
          { label: "Purchasing Power Remaining in Future", value: usd(futurePurchasingPower), primary: true },
          { label: "Future Dollars Needed to Buy Today's Basket", value: usd(equivalentFutureAmount) },
          { label: "Purchasing Power Lost", value: `-${pct(purchasingPowerLoss)}` }
        ],
        formula: "PV = FV / (1 + i)^n"
      };
    }
  },

  "fire-number-calculator": {
    fields: [
      { id: "annualRetirementExpenses", label: "Desired Annual Retirement Expenses ($)", type: "number", default: "75000" },
      { id: "safeWithdrawalRate", label: "Safe Withdrawal Rate (%) (Trinity Study 4%)", type: "number", default: "4.0", step: "0.25" }
    ],
    note: "Calculates your Financial Independence target portfolio, LeanFIRE, and FatFIRE numbers.",
    compute(v) {
      const exp = num(v.annualRetirementExpenses, "Expenses", { min: 1000 });
      const swr = num(v.safeWithdrawalRate, "SWR", { min: 1, max: 10 }) / 100;
      const fireNumber = exp / swr;
      const leanFire = (exp * 0.75) / swr;
      const fatFire = (exp * 1.50) / swr;
      return {
        results: [
          { label: "Core FIRE Number", value: usd(fireNumber), primary: true },
          { label: "LeanFIRE Number (75% budget)", value: usd(leanFire) },
          { label: "FatFIRE Number (150% budget)", value: usd(fatFire) },
          { label: "Monthly Retirement Spending Allowance", value: usd(exp / 12) }
        ],
        formula: "FIRE Number = Annual Expenses / Safe Withdrawal Rate (e.g. Expenses × 25)"
      };
    }
  },

  "emergency-fund-calculator": {
    fields: [
      { id: "monthlyRentMortgage", label: "Monthly Housing / Rent ($)", type: "number", default: "2100" },
      { id: "monthlyFoodUtilities", label: "Monthly Groceries & Essential Utilities ($)", type: "number", default: "950" },
      { id: "monthlyDebtInsurance", label: "Monthly Debt Minimums & Insurance ($)", type: "number", default: "650" },
      { id: "targetMonths", label: "Emergency Runway Target (Months) (Standard 3-6 mos)", type: "number", default: "6" }
    ],
    note: "Determines the exact liquid cash cushion needed in a high-yield savings account for emergencies.",
    compute(v) {
      const h = num(v.monthlyRentMortgage, "Housing", { min: 0 });
      const f = num(v.monthlyFoodUtilities, "Food/Utilities", { min: 0 });
      const d = num(v.monthlyDebtInsurance, "Debt/Insurance", { min: 0 });
      const months = num(v.targetMonths, "Months", { min: 1, max: 24 });
      const essentialMonthly = h + f + d;
      const targetFund = essentialMonthly * months;
      return {
        results: [
          { label: "Recommended Emergency Fund Goal", value: usd(targetFund), primary: true },
          { label: "Essential Monthly Survival Expenses", value: usd(essentialMonthly) },
          { label: "3-Month Minimum Threshold", value: usd(essentialMonthly * 3) }
        ],
        formula: "Fund Goal = Essential Monthly Expenses × Target Months"
      };
    }
  },

  "hourly-to-salary-wage": {
    fields: [
      { id: "hourlyRate", label: "Hourly Wage Rate ($/hr)", type: "number", default: "38.50", step: "0.25" },
      { id: "hoursPerWeek", label: "Average Hours Worked per Week", type: "number", default: "40" }
    ],
    note: "Converts hourly pay to annual, monthly, bi-weekly, and weekly wage equivalents.",
    compute(v) {
      const rate = num(v.hourlyRate, "Hourly Rate", { min: 1 });
      const hours = num(v.hoursPerWeek, "Hours/Week", { min: 1, max: 100 });
      const weekly = rate * hours;
      const annual = weekly * 52;
      const monthly = annual / 12;
      const biweekly = annual / 26;
      return {
        results: [
          { label: "Annual Salary Equivalent", value: usd(annual), primary: true },
          { label: "Monthly Salary Equivalent", value: usd(monthly) },
          { label: "Bi-Weekly Paycheck (Gross)", value: usd(biweekly) },
          { label: "Weekly Earnings", value: usd(weekly) }
        ],
        formula: "Annual = Hourly Rate × Hours/Week × 52"
      };
    }
  },

  "overtime-pay-calculator": {
    fields: [
      { id: "regularHourlyRate", label: "Base Regular Hourly Wage ($)", type: "number", default: "28" },
      { id: "regularHours", label: "Regular Hours Worked (Standard 40)", type: "number", default: "40" },
      { id: "overtimeHours", label: "Overtime Hours (Time-and-a-Half 1.5x)", type: "number", default: "12" },
      { id: "doubleTimeHours", label: "Holiday / Sunday Double-Time Hours (2.0x)", type: "number", default: "4" }
    ],
    note: "Calculates FLSA statutory overtime pay (time-and-a-half) and premium double-time pay.",
    compute(v) {
      const base = num(v.regularHourlyRate, "Hourly Wage", { min: 1 });
      const regHrs = num(v.regularHours, "Regular Hours", { min: 0 });
      const otHrs = num(v.overtimeHours, "Overtime Hours", { min: 0 });
      const dtHrs = num(v.doubleTimeHours, "Double Time Hours", { min: 0 });
      const regPay = base * regHrs;
      const otPay = (base * 1.5) * otHrs;
      const dtPay = (base * 2.0) * dtHrs;
      const totalGross = regPay + otPay + dtPay;
      return {
        results: [
          { label: "Total Gross Weekly Paycheck", value: usd(totalGross), primary: true },
          { label: "Overtime Premium Earnings (1.5x)", value: usd(otPay) },
          { label: "Double-Time Premium Earnings (2.0x)", value: usd(dtPay) },
          { label: "Base Regular Earnings", value: usd(regPay) }
        ],
        formula: "Gross = (Base × Reg Hrs) + (Base × 1.5 × OT Hrs) + (Base × 2 × DT Hrs)"
      };
    }
  },

  "tip-split-bill-calculator": {
    fields: [
      { id: "billAmount", label: "Pre-Tip Check / Bill Total ($)", type: "number", default: "145.50", step: "0.01" },
      { id: "tipPercent", label: "Tip Percentage (%)", type: "number", default: "20", step: "1" },
      { id: "numberOfPeople", label: "Number of People Splitting Bill", type: "number", default: "4" }
    ],
    note: "Calculates tip amount, total check, and fair individual share when splitting at restaurants.",
    compute(v) {
      const bill = num(v.billAmount, "Bill Amount", { min: 1 });
      const tipPct = num(v.tipPercent, "Tip %", { min: 0 }) / 100;
      const people = num(v.numberOfPeople, "People", { min: 1 });
      const tip = bill * tipPct;
      const total = bill + tip;
      const perPerson = total / people;
      const tipPerPerson = tip / people;
      return {
        results: [
          { label: "Total Per Person", value: usd(perPerson), primary: true },
          { label: "Tip Amount", value: usd(tip) },
          { label: "Grand Total (Bill + Tip)", value: usd(total) },
          { label: "Tip Contribution Per Person", value: usd(tipPerPerson) }
        ],
        formula: "Per Person = (Bill + (Bill × Tip%)) / People"
      };
    }
  },

  "sales-tax-reverse-calculator": {
    fields: [
      { id: "amount", label: "Input Dollar Amount ($)", type: "number", default: "108.50" },
      { id: "taxRate", label: "Sales Tax Rate (%) (e.g. 8.25%)", type: "number", default: "8.25", step: "0.05" },
      { id: "mode", label: "Calculation Direction", type: "select", default: "reverse", choices: [["reverse", "Reverse: Extract Pre-Tax Price from Total Paid"], ["forward", "Forward: Add Sales Tax to Pre-Tax Price"]] }
    ],
    note: "Easily separates sales tax from receipt totals or calculates total price with tax added.",
    compute(v) {
      const amt = num(v.amount, "Amount", { min: 0.01 });
      const rate = num(v.taxRate, "Tax Rate", { min: 0 }) / 100;
      if (v.mode === "reverse") {
        const preTax = amt / (1 + rate);
        const taxPaid = amt - preTax;
        return {
          results: [
            { label: "Pre-Tax Base Price", value: usd(preTax), primary: true },
            { label: "Sales Tax Amount Included", value: usd(taxPaid) },
            { label: "Total Paid", value: usd(amt) }
          ],
          formula: "Pre-Tax = Total / (1 + Tax Rate)"
        };
      } else {
        const tax = amt * rate;
        const total = amt + tax;
        return {
          results: [
            { label: "Total Price with Sales Tax", value: usd(total), primary: true },
            { label: "Sales Tax Added", value: usd(tax) },
            { label: "Pre-Tax Base Price", value: usd(amt) }
          ],
          formula: "Total = Pre-Tax × (1 + Tax Rate)"
        };
      }
    }
  },

  "loan-payoff-acceleration": {
    fields: [
      { id: "loanBalance", label: "Current Remaining Balance ($)", type: "number", default: "45000" },
      { id: "interestRate", label: "Interest Rate (%)", type: "number", default: "7.0", step: "0.1" },
      { id: "regularMonthlyPmt", label: "Current Required Monthly Payment ($)", type: "number", default: "650" },
      { id: "extraMonthlyPrincipal", label: "Extra Monthly Principal Payment ($)", type: "number", default: "200" }
    ],
    note: "Calculates interest saved and months shaved off your loan by making additional principal payments.",
    compute(v) {
      const bal = num(v.loanBalance, "Balance", { min: 100 });
      const r = (num(v.interestRate, "Interest Rate", { min: 0.01 }) / 100) / 12;
      const basePmt = num(v.regularMonthlyPmt, "Monthly Payment", { min: 10 });
      const extra = num(v.extraMonthlyPrincipal, "Extra Principal", { min: 1 });
      if (basePmt <= bal * r) throw new Error("Monthly payment must exceed monthly interest.");

      // Calculate baseline months
      let b1 = bal;
      let m1 = 0;
      let int1 = 0;
      while (b1 > 0 && m1 < 600) {
        const interest = b1 * r;
        int1 += interest;
        b1 -= (basePmt - interest);
        m1++;
      }

      // Calculate accelerated months
      let b2 = bal;
      let m2 = 0;
      let int2 = 0;
      while (b2 > 0 && m2 < 600) {
        const interest = b2 * r;
        int2 += interest;
        b2 -= (basePmt + extra - interest);
        m2++;
      }

      const interestSaved = Math.max(0, int1 - int2);
      const monthsSaved = Math.max(0, m1 - m2);
      return {
        results: [
          { label: "Total Interest Saved", value: usd(interestSaved), primary: true },
          { label: "Time Saved on Loan", value: `${monthsSaved} months (${(monthsSaved / 12).toFixed(1)} years)` },
          { label: "New Accelerated Payoff Timeline", value: `${m2} months` }
        ],
        formula: "Amortization acceleration with dedicated principal paydown"
      };
    }
  },

  "auto-lease-vs-buy": {
    fields: [
      { id: "vehiclePrice", label: "Negotiated Vehicle Purchase Price ($)", type: "number", default: "38000" },
      { id: "downPayment", label: "Down Payment / Cap Cost Reduction ($)", type: "number", default: "4000" },
      { id: "leaseMonthlyPmt", label: "Monthly Lease Payment (36 mos) ($)", type: "number", default: "460" },
      { id: "buyMonthlyPmt", label: "Monthly Loan Finance Payment (60 mos) ($)", type: "number", default: "680" },
      { id: "residualValue", label: "Vehicle Market Value after 5 Years ($)", type: "number", default: "17000" }
    ],
    note: "Compares 5-year Total Cost of Ownership between leasing continuously vs financing to own.",
    compute(v) {
      num(v.vehiclePrice, "Vehicle Price", { min: 1000 });
      const dp = num(v.downPayment, "Down Payment", { min: 0 });
      const leasePmt = num(v.leaseMonthlyPmt, "Lease Payment", { min: 50 });
      const buyPmt = num(v.buyMonthlyPmt, "Loan Payment", { min: 50 });
      const residual = num(v.residualValue, "Residual Value", { min: 0 });

      // Buying: 60 payments + down payment - residual equity retained
      const totalBuyPaid = dp + (buyPmt * 60);
      const netBuyCost = totalBuyPaid - residual;
      // Leasing: 2 consecutive leases over 5 years (60 months) + 2 down payments
      const netLeaseCost = (dp * 1.66) + (leasePmt * 60);
      const difference = netLeaseCost - netBuyCost;
      return {
        results: [
          { label: "5-Year Financial Advantage", value: difference >= 0 ? `Buying saves ${usd(difference)}` : `Leasing saves ${usd(Math.abs(difference))}`, primary: true },
          { label: "Net Cost to Buy & Keep (after equity)", value: usd(netBuyCost) },
          { label: "Net Cost to Lease (Zero Equity)", value: usd(netLeaseCost) }
        ],
        formula: "Net Buying Cost = Total Payments - Retained Vehicle Equity"
      };
    }
  },

  "student-loan-refinance": {
    fields: [
      { id: "currentBalance", label: "Total Student Loan Debt ($)", type: "number", default: "65000" },
      { id: "currentRate", label: "Current Average Interest Rate (%)", type: "number", default: "7.8", step: "0.1" },
      { id: "refinanceRate", label: "New Private Refinanced Rate (%)", type: "number", default: "5.2", step: "0.1" },
      { id: "termYears", label: "Repayment Term (Years)", type: "number", default: "10" }
    ],
    note: "Calculates interest savings when refinancing high-interest student debt to a private lender.",
    compute(v) {
      const bal = num(v.currentBalance, "Balance", { min: 1000 });
      const r1 = (num(v.currentRate, "Current Rate", { min: 0.01 }) / 100) / 12;
      const r2 = (num(v.refinanceRate, "New Rate", { min: 0.01 }) / 100) / 12;
      const n = num(v.termYears, "Term", { min: 1 }) * 12;
      const pmt1 = (bal * (r1 * Math.pow(1 + r1, n))) / (Math.pow(1 + r1, n) - 1);
      const pmt2 = (bal * (r2 * Math.pow(1 + r2, n))) / (Math.pow(1 + r2, n) - 1);
      const totalInt1 = (pmt1 * n) - bal;
      const totalInt2 = (pmt2 * n) - bal;
      const interestSaved = totalInt1 - totalInt2;
      return {
        results: [
          { label: "Total Interest Saved via Refinancing", value: usd(interestSaved), primary: true },
          { label: "Monthly Payment Savings", value: `${usd(pmt1 - pmt2)} / month` },
          { label: "New Monthly Payment", value: usd(pmt2) }
        ],
        formula: "Interest Saved = Total Interest Current - Total Interest Refinanced"
      };
    }
  },

  "match-401k-maximizer": {
    fields: [
      { id: "annualSalary", label: "Annual Gross Salary ($)", type: "number", default: "95000" },
      { id: "matchRate", label: "Employer Match % (e.g. 50% or 100%)", type: "number", default: "100", step: "5" },
      { id: "maxMatchCapPercent", label: "Up to % of Your Salary Matched (e.g. 5%)", type: "number", default: "5", step: "1" }
    ],
    note: "Calculates the employee contribution required to capture 100% of employer matching funds (free money).",
    compute(v) {
      const salary = num(v.annualSalary, "Salary", { min: 1000 });
      const matchRate = num(v.matchRate, "Match Rate", { min: 1 }) / 100;
      const capPct = num(v.maxMatchCapPercent, "Cap %", { min: 1 }) / 100;
      const employeeContributionNeeded = salary * capPct;
      const freeEmployerMatch = employeeContributionNeeded * matchRate;
      const totalAnnualContribution = employeeContributionNeeded + freeEmployerMatch;
      return {
        results: [
          { label: "Free Annual Employer Match Money", value: usd(freeEmployerMatch), primary: true },
          { label: "Employee Contribution Required to Max", value: usd(employeeContributionNeeded) },
          { label: "Total Annual Portfolio Inflow", value: usd(totalAnnualContribution) },
          { label: "Immediate Return on Investment", value: pct(matchRate * 100) }
        ],
        formula: "Employer Match = Salary × Match Cap % × Match Rate %"
      };
    }
  },

  "paycheck-takehome-calculator": {
    fields: [
      { id: "annualSalary", label: "Gross Annual Salary ($)", type: "number", default: "85000" },
      { id: "payFrequency", label: "Pay Frequency", type: "select", default: "biweekly", choices: [["biweekly", "Bi-Weekly (26 paychecks/yr)"], ["semimonthly", "Semi-Monthly (24 paychecks/yr)"], ["monthly", "Monthly (12 paychecks/yr)"]] }
    ],
    note: "Estimates US Federal Income Tax, Social Security (6.2%), and Medicare (1.45%) paycheck withholdings.",
    compute(v) {
      const salary = num(v.annualSalary, "Salary", { min: 1000 });
      const stdDed = 14600; // Single standard deduction
      const taxable = Math.max(0, salary - stdDed);
      // Federal tax brackets: 10%, 12%, 22%, 24%
      let fedTax = 0;
      if (taxable > 0) fedTax += Math.min(taxable, 11600) * 0.10;
      if (taxable > 11600) fedTax += Math.min(taxable - 11600, 47150 - 11600) * 0.12;
      if (taxable > 47150) fedTax += Math.min(taxable - 47150, 100525 - 47150) * 0.22;
      if (taxable > 100525) fedTax += (taxable - 100525) * 0.24;

      const socSec = Math.min(salary, 168600) * 0.062;
      const medicare = salary * 0.0145;
      const totalWithholding = fedTax + socSec + medicare;
      const netAnnual = salary - totalWithholding;

      let periods = 26;
      if (v.payFrequency === "semimonthly") periods = 24;
      else if (v.payFrequency === "monthly") periods = 12;

      return {
        results: [
          { label: "Estimated Paycheck Take-Home Pay", value: usd(netAnnual / periods), primary: true },
          { label: "Annual Take-Home Pay", value: usd(netAnnual) },
          { label: "Federal Income Tax Withholding", value: usd(fedTax) },
          { label: "FICA Taxes (Social Security & Medicare)", value: usd(socSec + medicare) }
        ],
        formula: "Net Paycheck = (Gross - Fed Tax - Social Security - Medicare) / Pay Periods"
      };
    }
  },

  "credit-card-minimum-payment-trap": {
    fields: [
      { id: "creditBalance", label: "Credit Card Debt Balance ($)", type: "number", default: "8500" },
      { id: "apr", label: "Credit Card APR (%) (US average ~21% - 24%)", type: "number", default: "22.5", step: "0.1" },
      { id: "minPmtPercent", label: "Minimum Payment % of Balance (Standard 2% - 3%)", type: "number", default: "2.5", step: "0.1" }
    ],
    note: "Demonstrates the multi-decade credit card minimum payment trap mandated on monthly billing statements.",
    compute(v) {
      const bal = num(v.creditBalance, "Balance", { min: 100 });
      const r = (num(v.apr, "APR", { min: 1 }) / 100) / 12;
      const minRate = num(v.minPmtPercent, "Min %", { min: 1, max: 10 }) / 100;
      let balance = bal;
      let months = 0;
      let totalInterest = 0;
      while (balance > 25 && months < 600) {
        const interest = balance * r;
        totalInterest += interest;
        const pmt = Math.max(25, balance * minRate);
        balance -= (pmt - interest);
        months++;
      }
      return {
        results: [
          { label: "Time to Debt Freedom (Min Payments)", value: `${(months / 12).toFixed(1)} years (${months} months)`, primary: true },
          { label: "Total Interest Paid to Bank", value: usd(totalInterest) },
          { label: "Total Money Paid ($8.5k balance)", value: usd(bal + totalInterest) }
        ],
        formula: "Amortization under dynamic minimum payment percentage floor"
      };
    }
  },

  "net-worth-tracker-calculator": {
    fields: [
      { id: "cashLiquid", label: "Bank Accounts & Cash Equivalents ($)", type: "number", default: "35000" },
      { id: "investments", label: "Stocks, ETFs, 401(k), IRA & Crypto ($)", type: "number", default: "185000" },
      { id: "realEstateVehicles", label: "Home Market Value & Vehicles ($)", type: "number", default: "450000" },
      { id: "mortgageDebt", label: "Remaining Mortgage Balance ($)", type: "number", default: "280000" },
      { id: "consumerDebt", label: "Auto, Student Loan & Credit Card Debt ($)", type: "number", default: "32000" }
    ],
    note: "Calculates personal Net Worth: Total Owned Assets minus Total Owed Liabilities.",
    compute(v) {
      const cash = num(v.cashLiquid, "Cash", { min: 0 });
      const inv = num(v.investments, "Investments", { min: 0 });
      const physical = num(v.realEstateVehicles, "Real Estate", { min: 0 });
      const mort = num(v.mortgageDebt, "Mortgage", { min: 0 });
      const consumer = num(v.consumerDebt, "Consumer Debt", { min: 0 });
      const totalAssets = cash + inv + physical;
      const totalLiabilities = mort + consumer;
      const netWorth = totalAssets - totalLiabilities;
      return {
        results: [
          { label: "Total Personal Net Worth", value: usd(netWorth), primary: true },
          { label: "Total Assets Owned", value: usd(totalAssets) },
          { label: "Total Liabilities Owed", value: usd(totalLiabilities) },
          { label: "Debt-to-Asset Ratio", value: pct(totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0) }
        ],
        formula: "Net Worth = Total Assets - Total Liabilities"
      };
    }
  },

  "hysa-vs-cd-calculator": {
    fields: [
      { id: "depositAmount", label: "Initial Deposit Amount ($)", type: "number", default: "25000" },
      { id: "hysaRate", label: "High-Yield Savings Annual Rate (%)", type: "number", default: "4.25", step: "0.05" },
      { id: "cdRate", label: "Fixed Certificate of Deposit Rate (%)", type: "number", default: "5.10", step: "0.05" },
      { id: "termMonths", label: "Lock-in Horizon (Months)", type: "number", default: "12" }
    ],
    note: "Compares interest earnings between liquid savings accounts and fixed Certificate of Deposit terms.",
    compute(v) {
      const p = num(v.depositAmount, "Deposit", { min: 100 });
      const rHysa = num(v.hysaRate, "HYSA Rate", { min: 0 }) / 100;
      const rCd = num(v.cdRate, "CD Rate", { min: 0 }) / 100;
      const months = num(v.termMonths, "Months", { min: 1, max: 60 });
      const hysaInterest = p * (Math.pow(1 + (rHysa / 12), months) - 1);
      const cdInterest = p * (Math.pow(1 + (rCd / 12), months) - 1);
      const extraProfit = cdInterest - hysaInterest;
      return {
        results: [
          { label: "Fixed CD Interest Earned", value: usd(cdInterest), primary: true },
          { label: "HYSA Liquid Interest Earned", value: usd(hysaInterest) },
          { label: "Guaranteed CD Premium", value: `+${usd(extraProfit)} extra return` }
        ],
        formula: "Interest = Principal × [(1 + r/12)^n - 1]"
      };
    }
  },

  "capital-gains-tax-advanced": {
    fields: [
      { id: "proceeds", label: "Asset Sale Proceeds ($)", type: "number", default: "45000" },
      { id: "costBasis", label: "Original Cost Basis ($)", type: "number", default: "18000" },
      { id: "holdingPeriod", label: "Holding Period", type: "select", default: "longterm", choices: [["longterm", "Long-Term (Held > 1 year: 0% / 15% / 20%)"], ["shortterm", "Short-Term (Held ≤ 1 year: Ordinary Income)"]] },
      { id: "householdTaxableIncome", label: "Other Taxable Income ($)", type: "number", default: "95000" }
    ],
    note: "Federal capital gains tax calculation distinguishing long-term preferential rates from short-term ordinary rates.",
    compute(v) {
      const sale = num(v.proceeds, "Sale Proceeds", { min: 1 });
      const cost = num(v.costBasis, "Cost Basis", { min: 0 });
      const otherIncome = num(v.householdTaxableIncome, "Other Income", { min: 0 });
      const gain = sale - cost;
      if (gain <= 0) {
        return {
          results: [
            { label: "Capital Loss Realized", value: usd(Math.abs(gain)), primary: true },
            { label: "Tax Liability", value: "$0.00 (Up to $3,000 deductible against ordinary income)" }
          ]
        };
      }
      let tax = 0;
      if (v.holdingPeriod === "shortterm") {
        tax = gain * 0.22; // approx ordinary bracket
      } else {
        // Federal long-term rates (0%, 15%, 20%)
        const totalIncome = otherIncome + gain;
        if (totalIncome <= 47025) tax = 0;
        else if (totalIncome <= 518900) tax = gain * 0.15;
        else tax = gain * 0.20;
      }
      return {
        results: [
          { label: "Federal Capital Gains Tax Due", value: usd(tax), primary: true },
          { label: "Net Capital Gain Realized", value: usd(gain) },
          { label: "Net After-Tax Profit", value: usd(gain - tax) }
        ],
        formula: "Tax = Capital Gain × Rate (15%/20% Long-Term vs Ordinary Short-Term)"
      };
    }
  }
};
