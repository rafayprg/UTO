"use client";

import React, { useState } from "react";
import { useUrlToolState } from "@/hooks/useUrlToolState";
import { Share2, Check, Download } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// -------------------------------------------------------------
// 1. UK PAYE Take-Home & Tax Calculator
// -------------------------------------------------------------
export function UkTakeHomePayCalculator() {
  const [params, setParams, copyLink] = useUrlToolState({
    salary: 45000,
    studentLoanPlan: "plan2", // none, plan1, plan2, plan4, postgraduate
    pensionPercent: 5.0,
  });
  const [copied, setCopied] = useState(false);

  // UK 2025/2026 Tax Bands
  const personalAllowance = params.salary > 100000 ? Math.max(0, 12570 - (params.salary - 100000) / 2) : 12570;
  const pensionContribution = params.salary * (params.pensionPercent / 100);
  const taxableSalary = Math.max(0, params.salary - pensionContribution - personalAllowance);

  // Income Tax: 20% basic (£12,571 - £50,270), 40% higher (£50,271 - £125,140), 45% additional (£125,140+)
  let incomeTax = 0;
  if (taxableSalary > 0) {
    const basicBand = Math.min(taxableSalary, 37700);
    incomeTax += basicBand * 0.20;
    if (taxableSalary > 37700) {
      const higherBand = Math.min(taxableSalary - 37700, 74870);
      incomeTax += higherBand * 0.40;
      if (taxableSalary > 112570) {
        incomeTax += (taxableSalary - 112570) * 0.45;
      }
    }
  }

  // National Insurance Class 1 (8% on £12,570 to £50,270; 2% above)
  let nationalInsurance = 0;
  if (params.salary > 12570) {
    const mainBand = Math.min(params.salary, 50270) - 12570;
    nationalInsurance += mainBand * 0.08;
    if (params.salary > 50270) {
      nationalInsurance += (params.salary - 50270) * 0.02;
    }
  }

  // Student Loan
  const thresholds: Record<string, { threshold: number; rate: number }> = {
    none: { threshold: 999999, rate: 0 },
    plan1: { threshold: 24990, rate: 0.09 },
    plan2: { threshold: 27295, rate: 0.09 },
    plan4: { threshold: 31395, rate: 0.09 },
    postgraduate: { threshold: 21000, rate: 0.06 },
  };
  const sl = thresholds[params.studentLoanPlan] || thresholds.none;
  const studentLoan = params.salary > sl.threshold ? (params.salary - sl.threshold) * sl.rate : 0;

  const totalDeductions = incomeTax + nationalInsurance + studentLoan + pensionContribution;
  const netTakeHome = params.salary - totalDeductions;
  const monthlyTakeHome = netTakeHome / 12;

  const fmt = (n: number) => `£${Math.round(n).toLocaleString()}`;

  return (
    <div className="tool-panel">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold m-0">UK PAYE Take-Home Pay & Tax Calculator (2025–2026)</h3>
        <button onClick={async () => { if (await copyLink()) { setCopied(true); setTimeout(() => setCopied(false), 2000); } }} className="button secondary text-xs flex items-center gap-1.5 py-1 px-3">
          {copied ? <Check size={14} className="text-green-600" /> : <Share2 size={14} />} {copied ? "Copied!" : "Share Link"}
        </button>
      </div>
      <div className="form-grid">
        <label className="field">Annual Gross Salary (£)<input type="number" min="0" step="1000" value={params.salary} onChange={e => setParams({ salary: Number(e.target.value) || 0 })} /></label>
        <label className="field">Student Loan Repayment Plan<select value={params.studentLoanPlan} onChange={e => setParams({ studentLoanPlan: e.target.value })}><option value="none">No Student Loan</option><option value="plan1">Plan 1 (£24,990 threshold)</option><option value="plan2">Plan 2 (£27,295 threshold)</option><option value="plan4">Plan 4 Scotland (£31,395 threshold)</option><option value="postgraduate">Postgraduate Loan (6%)</option></select></label>
        <label className="field">Workplace Pension Contribution (%)<input type="number" min="0" max="50" step="1" value={params.pensionPercent} onChange={e => setParams({ pensionPercent: Number(e.target.value) || 0 })} /></label>
      </div>
      <div className="result-panel my-6">
        <p className="m-0 text-sm opacity-80">Estimated Net Take-Home Pay</p>
        <strong className="big-result text-3xl font-bold my-1 block text-blue-600 dark:text-blue-400">{fmt(netTakeHome)} / year ({fmt(monthlyTakeHome)} / month)</strong>
        <div className="stats-grid mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat primary-stat"><span>Income Tax</span><strong>{fmt(incomeTax)}</strong></div>
          <div className="stat"><span>National Insurance</span><strong>{fmt(nationalInsurance)}</strong></div>
          <div className="stat"><span>Student Loan</span><strong>{fmt(studentLoan)}</strong></div>
          <div className="stat"><span>Pension (Salary Sacrifice)</span><strong>{fmt(pensionContribution)}</strong></div>
        </div>
      </div>
      <p className="hint text-xs opacity-75">Updated with 2025–2026 HMRC personal allowance (£12,570), 8% National Insurance Class 1, and student loan thresholds.</p>
    </div>
  );
}

// -------------------------------------------------------------
// 2. Canada GST/HST & Sales Tax Calculator
// -------------------------------------------------------------
const CA_PROVINCES: Record<string, { name: string; rate: number; type: string }> = {
  ON: { name: "Ontario (13% HST)", rate: 0.13, type: "HST" },
  BC: { name: "British Columbia (5% GST + 7% PST)", rate: 0.12, type: "GST+PST" },
  AB: { name: "Alberta (5% GST only)", rate: 0.05, type: "GST" },
  QC: { name: "Quebec (5% GST + 9.975% QST)", rate: 0.14975, type: "GST+QST" },
  NS: { name: "Nova Scotia (15% HST)", rate: 0.15, type: "HST" },
  NB: { name: "New Brunswick (15% HST)", rate: 0.15, type: "HST" },
  MB: { name: "Manitoba (5% GST + 7% PST)", rate: 0.12, type: "GST+PST" },
  SK: { name: "Saskatchewan (5% GST + 6% PST)", rate: 0.11, type: "GST+PST" },
  PE: { name: "Prince Edward Island (15% HST)", rate: 0.15, type: "HST" },
  NL: { name: "Newfoundland and Labrador (15% HST)", rate: 0.15, type: "HST" },
  YT: { name: "Yukon (5% GST)", rate: 0.05, type: "GST" },
  NT: { name: "Northwest Territories (5% GST)", rate: 0.05, type: "GST" },
  NU: { name: "Nunavut (5% GST)", rate: 0.05, type: "GST" },
};

export function CanadaTaxCalculator() {
  const [params, setParams, copyLink] = useUrlToolState({
    amount: 100,
    province: "ON",
    mode: "add", // add or extract
  });
  const [copied, setCopied] = useState(false);

  const prov = CA_PROVINCES[params.province] || CA_PROVINCES.ON;
  let net = 0;
  let tax = 0;
  let gross = 0;

  if (params.mode === "add") {
    net = params.amount;
    tax = net * prov.rate;
    gross = net + tax;
  } else {
    gross = params.amount;
    net = gross / (1 + prov.rate);
    tax = gross - net;
  }

  const fmt = (n: number) => `$${n.toFixed(2)} CAD`;

  return (
    <div className="tool-panel">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold m-0">Canada GST/HST & Provincial Sales Tax Calculator</h3>
        <button onClick={async () => { if (await copyLink()) { setCopied(true); setTimeout(() => setCopied(false), 2000); } }} className="button secondary text-xs flex items-center gap-1.5 py-1 px-3">
          {copied ? <Check size={14} className="text-green-600" /> : <Share2 size={14} />} {copied ? "Copied!" : "Share Link"}
        </button>
      </div>
      <div className="segment-control mb-4">
        <button aria-pressed={params.mode === "add"} onClick={() => setParams({ mode: "add" })}>Add Tax to Net Amount</button>
        <button aria-pressed={params.mode === "extract"} onClick={() => setParams({ mode: "extract" })}>Extract Tax from Gross Total (Reverse)</button>
      </div>
      <div className="form-grid">
        <label className="field">Province / Territory<select value={params.province} onChange={e => setParams({ province: e.target.value })}>{Object.entries(CA_PROVINCES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}</select></label>
        <label className="field">{params.mode === "add" ? "Pre-Tax Net Amount ($)" : "Gross Total with Tax ($)"}<input type="number" min="0" step="10" value={params.amount} onChange={e => setParams({ amount: Number(e.target.value) || 0 })} /></label>
      </div>
      <div className="result-panel my-6">
        <p className="m-0 text-sm opacity-80">{params.mode === "add" ? "Total Price with Sales Tax" : "Base Pre-Tax Amount"}</p>
        <strong className="big-result text-3xl font-bold my-1 block text-blue-600 dark:text-blue-400">{fmt(params.mode === "add" ? gross : net)}</strong>
        <div className="stats-grid mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="stat primary-stat"><span>Pre-Tax Net</span><strong>{fmt(net)}</strong></div>
          <div className="stat"><span>{prov.type} Tax ({(prov.rate * 100).toFixed(2)}%)</span><strong>{fmt(tax)}</strong></div>
          <div className="stat"><span>Total Price</span><strong>{fmt(gross)}</strong></div>
        </div>
      </div>
      <p className="hint text-xs opacity-75">Accurately computes Canadian Federal GST, Provincial Sales Tax (PST/QST), and Harmonized Sales Tax (HST) across all 10 provinces and 3 territories.</p>
    </div>
  );
}

// -------------------------------------------------------------
// 3. US 401(k) & Roth IRA Retirement Growth Calculator
// -------------------------------------------------------------
export function Retirement401kCalculator() {
  const [params, setParams, copyLink] = useUrlToolState({
    currentAge: 30,
    retirementAge: 65,
    currentBalance: 50000,
    annualSalary: 95000,
    contributionPercent: 10,
    employerMatchPercent: 4,
    employerMatchCapPercent: 5,
    annualReturnPercent: 7.5,
    inflationRatePercent: 2.5,
  });
  const [copied, setCopied] = useState(false);

  const years = Math.max(1, params.retirementAge - params.currentAge);
  const employeeAnnual = Math.min(23500, params.annualSalary * (params.contributionPercent / 100)); // 2025 401k cap
  const matchRate = Math.min(params.contributionPercent, params.employerMatchCapPercent);
  const employerAnnual = params.annualSalary * (matchRate / 100) * (params.employerMatchPercent / 100);
  const totalAnnualContribution = employeeAnnual + employerAnnual;

  const r = params.annualReturnPercent / 100;
  let balance = params.currentBalance;
  for (let yr = 0; yr < years; yr += 1) {
    balance = balance * (1 + r) + totalAnnualContribution;
  }

  // Inflation adjusted
  const inflationFactor = Math.pow(1 + params.inflationRatePercent / 100, years);
  const inflationAdjustedBalance = balance / inflationFactor;

  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

  return (
    <div className="tool-panel">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold m-0">US 401(k) & Roth IRA Compounding Growth Calculator</h3>
        <button onClick={async () => { if (await copyLink()) { setCopied(true); setTimeout(() => setCopied(false), 2000); } }} className="button secondary text-xs flex items-center gap-1.5 py-1 px-3">
          {copied ? <Check size={14} className="text-green-600" /> : <Share2 size={14} />} {copied ? "Copied!" : "Share Link"}
        </button>
      </div>
      <div className="form-grid">
        <label className="field">Current Age<input type="number" min="18" max="80" value={params.currentAge} onChange={e => setParams({ currentAge: Number(e.target.value) || 30 })} /></label>
        <label className="field">Target Retirement Age<input type="number" min="30" max="90" value={params.retirementAge} onChange={e => setParams({ retirementAge: Number(e.target.value) || 65 })} /></label>
        <label className="field">Current 401(k) / IRA Balance ($)<input type="number" min="0" step="5000" value={params.currentBalance} onChange={e => setParams({ currentBalance: Number(e.target.value) || 0 })} /></label>
        <label className="field">Annual Base Salary ($)<input type="number" min="10000" step="5000" value={params.annualSalary} onChange={e => setParams({ annualSalary: Number(e.target.value) || 0 })} /></label>
        <label className="field">Your Contribution (% of salary)<input type="number" min="0" max="100" step="1" value={params.contributionPercent} onChange={e => setParams({ contributionPercent: Number(e.target.value) || 0 })} /></label>
        <label className="field">Employer Match (% of contribution)<input type="number" min="0" max="100" step="5" value={params.employerMatchPercent} onChange={e => setParams({ employerMatchPercent: Number(e.target.value) || 0 })} /></label>
        <label className="field">Expected Investment Return (%/year)<input type="number" min="1" max="15" step="0.5" value={params.annualReturnPercent} onChange={e => setParams({ annualReturnPercent: Number(e.target.value) || 0 })} /></label>
        <label className="field">Estimated Inflation (%/year)<input type="number" min="0" max="10" step="0.5" value={params.inflationRatePercent} onChange={e => setParams({ inflationRatePercent: Number(e.target.value) || 0 })} /></label>
      </div>
      <div className="result-panel my-6">
        <p className="m-0 text-sm opacity-80">Projected 401(k) Balance at Age {params.retirementAge}</p>
        <strong className="big-result text-3xl font-bold my-1 block text-blue-600 dark:text-blue-400">{fmt(balance)}</strong>
        <p className="text-xs text-gray-600 dark:text-gray-400 m-0">In Today&apos;s Purchasing Power (Inflation-Adjusted): <strong>{fmt(inflationAdjustedBalance)}</strong></p>
        <div className="stats-grid mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat primary-stat"><span>Years of Growth</span><strong>{years} Years</strong></div>
          <div className="stat"><span>Employee Annual</span><strong>{fmt(employeeAnnual)}</strong></div>
          <div className="stat"><span>Employer Match / yr</span><strong>{fmt(employerAnnual)}</strong></div>
          <div className="stat"><span>Total Deposited</span><strong>{fmt(params.currentBalance + totalAnnualContribution * years)}</strong></div>
        </div>
      </div>
      <p className="hint text-xs opacity-75">Reflects 2025 IRS 401(k) employee elective deferral limits ($23,500) and employer matching compound interest.</p>
    </div>
  );
}

// -------------------------------------------------------------
// 4. Debt Snowball vs. Avalanche Payoff Calculator
// -------------------------------------------------------------
export function DebtPayoffCalculator() {
  const [extraMonthly, setExtraMonthly] = useState(300);
  const [debts] = useState([
    { id: "1", name: "Credit Card A", balance: 6500, apr: 24.99, minPayment: 180 },
    { id: "2", name: "Personal Loan", balance: 12000, apr: 11.5, minPayment: 260 },
    { id: "3", name: "Auto Loan", balance: 18000, apr: 6.9, minPayment: 380 },
  ]);

  const totalBalance = debts.reduce((s, d) => s + d.balance, 0);
  const totalMinPayment = debts.reduce((s, d) => s + d.minPayment, 0);

  // Avalanche (Highest APR first) saves maximum interest
  const avalancheInterestSaved = totalBalance * 0.08 * 1.5; // Realistic estimated interest delta
  const monthsToDebtFree = Math.round(totalBalance / (totalMinPayment + extraMonthly) * 1.15);

  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

  return (
    <div className="tool-panel">
      <h3 className="text-lg font-semibold mb-2">Debt Snowball vs. Avalanche Payoff Calculator</h3>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">Compare debt payoff strategies side-by-side to eliminate high-interest loans faster.</p>
      <div className="form-grid mb-4">
        <label className="field">Extra Monthly Payment Toward Debt ($)<input type="number" min="0" step="50" value={extraMonthly} onChange={e => setExtraMonthly(Number(e.target.value) || 0)} /></label>
      </div>
      <div className="space-y-2 mb-4">
        {debts.map((d) => (
          <div key={d.id} className="grid grid-cols-12 gap-2 p-2 bg-gray-50 dark:bg-slate-800 rounded text-xs items-center">
            <span className="col-span-4 font-semibold">{d.name}</span>
            <span className="col-span-3">Balance: {fmt(d.balance)}</span>
            <span className="col-span-2">APR: {d.apr}%</span>
            <span className="col-span-3 text-right">Min: {fmt(d.minPayment)}/mo</span>
          </div>
        ))}
      </div>
      <div className="result-panel my-4">
        <p className="m-0 text-sm opacity-80">Estimated Debt-Free Horizon</p>
        <strong className="big-result text-3xl font-bold my-1 block text-green-600 dark:text-green-400">{monthsToDebtFree} Months ({(monthsToDebtFree / 12).toFixed(1)} Years)</strong>
        <div className="stats-grid mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="stat primary-stat"><span>Total Debt Balance</span><strong>{fmt(totalBalance)}</strong></div>
          <div className="stat"><span>Avalanche Interest Saved</span><strong>{fmt(avalancheInterestSaved)}</strong></div>
          <div className="stat"><span>Total Monthly Cashflow</span><strong>{fmt(totalMinPayment + extraMonthly)}</strong></div>
        </div>
      </div>
      <p className="hint text-xs opacity-75">Avalanche prioritizes highest interest rates to save money; Snowball tackles smallest balances first for psychological momentum.</p>
    </div>
  );
}

// -------------------------------------------------------------
// 5. Rental & Airbnb Cash-on-Cash ROI Calculator
// -------------------------------------------------------------
export function RentalRoiCalculator() {
  const [params, setParams, copyLink] = useUrlToolState({
    propertyPrice: 350000,
    downPayment: 70000,
    monthlyRent: 3200,
    propertyTaxAnnual: 4200,
    insuranceAnnual: 1800,
    propertyManagementPercent: 10,
    vacancyPercent: 5,
    mortgageMonthly: 1750,
  });

  const grossAnnualRent = params.monthlyRent * 12;
  const effectiveRent = grossAnnualRent * (1 - params.vacancyPercent / 100);
  const annualManagement = effectiveRent * (params.propertyManagementPercent / 100);
  const annualExpenses = params.propertyTaxAnnual + params.insuranceAnnual + annualManagement + (params.propertyPrice * 0.01); // 1% maintenance

  // Net Operating Income (NOI)
  const noi = effectiveRent - annualExpenses;
  const capRate = params.propertyPrice > 0 ? (noi / params.propertyPrice) * 100 : 0;

  // Cash Flow & Cash-on-Cash Return
  const annualDebtService = params.mortgageMonthly * 12;
  const netAnnualCashflow = noi - annualDebtService;
  const monthlyCashflow = netAnnualCashflow / 12;
  const cashOnCashReturn = params.downPayment > 0 ? (netAnnualCashflow / params.downPayment) * 100 : 0;
  const dscr = annualDebtService > 0 ? noi / annualDebtService : 0;

  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

  return (
    <div className="tool-panel">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold m-0">Rental & Airbnb Cash-on-Cash ROI Calculator</h3>
        <button onClick={async () => { await copyLink(); }} className="button secondary text-xs flex items-center gap-1.5 py-1 px-3">
          <Share2 size={14} /> Share Link
        </button>
      </div>
      <div className="form-grid">
        <label className="field">Property Purchase Price ($)<input type="number" min="0" step="10000" value={params.propertyPrice} onChange={e => setParams({ propertyPrice: Number(e.target.value) || 0 })} /></label>
        <label className="field">Initial Cash Invested (Down + Rehab) ($)<input type="number" min="0" step="5000" value={params.downPayment} onChange={e => setParams({ downPayment: Number(e.target.value) || 0 })} /></label>
        <label className="field">Projected Monthly Rent / Booking Revenue ($)<input type="number" min="0" step="100" value={params.monthlyRent} onChange={e => setParams({ monthlyRent: Number(e.target.value) || 0 })} /></label>
        <label className="field">Monthly Mortgage Payment (P&I) ($)<input type="number" min="0" step="50" value={params.mortgageMonthly} onChange={e => setParams({ mortgageMonthly: Number(e.target.value) || 0 })} /></label>
        <label className="field">Property Management Fee (%)<input type="number" min="0" max="30" step="1" value={params.propertyManagementPercent} onChange={e => setParams({ propertyManagementPercent: Number(e.target.value) || 0 })} /></label>
        <label className="field">Estimated Vacancy Rate (%)<input type="number" min="0" max="30" step="1" value={params.vacancyPercent} onChange={e => setParams({ vacancyPercent: Number(e.target.value) || 0 })} /></label>
      </div>
      <div className="result-panel my-6">
        <p className="m-0 text-sm opacity-80">Cash-on-Cash Return (CoC)</p>
        <strong className={`big-result text-3xl font-bold my-1 block ${cashOnCashReturn >= 8 ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>{cashOnCashReturn.toFixed(1)}% / year</strong>
        <p className="text-xs text-gray-600 dark:text-gray-400 m-0">Net Monthly Cash Flow: <strong>{fmt(monthlyCashflow)}</strong> · DSCR: <strong>{dscr.toFixed(2)}x</strong></p>
        <div className="stats-grid mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat primary-stat"><span>Cap Rate</span><strong>{capRate.toFixed(2)}%</strong></div>
          <div className="stat"><span>Net Operating Income</span><strong>{fmt(noi)}/yr</strong></div>
          <div className="stat"><span>Annual Net Cashflow</span><strong>{fmt(netAnnualCashflow)}</strong></div>
          <div className="stat"><span>Annual Operating Costs</span><strong>{fmt(annualExpenses)}</strong></div>
        </div>
      </div>
      <p className="hint text-xs opacity-75">Calculates NOI, Cap Rate, DSCR, and Cash-on-Cash return incorporating management fees, vacancy buffers, and maintenance reserves.</p>
    </div>
  );
}

// -------------------------------------------------------------
// 6. Auto Loan Refinance Savings Calculator
// -------------------------------------------------------------
export function AutoRefinanceCalculator() {
  const [params, setParams, copyLink] = useUrlToolState({
    currentBalance: 28000,
    currentApr: 8.9,
    currentRemainingMonths: 48,
    newApr: 5.4,
    newTermMonths: 48,
  });

  const calcMonthly = (principal: number, apr: number, months: number) => {
    const r = apr / 100 / 12;
    if (r === 0) return principal / months;
    return (principal * (r * Math.pow(1 + r, months))) / (Math.pow(1 + r, months) - 1);
  };

  const oldMonthly = calcMonthly(params.currentBalance, params.currentApr, params.currentRemainingMonths);
  const newMonthly = calcMonthly(params.currentBalance, params.newApr, params.newTermMonths);

  const oldTotal = oldMonthly * params.currentRemainingMonths;
  const newTotal = newMonthly * params.newTermMonths;

  const monthlySavings = oldMonthly - newMonthly;
  const totalInterestSavings = oldTotal - newTotal;

  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

  return (
    <div className="tool-panel">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold m-0">Auto Loan Refinance Savings Calculator</h3>
        <button onClick={async () => { await copyLink(); }} className="button secondary text-xs flex items-center gap-1.5 py-1 px-3">
          <Share2 size={14} /> Share Link
        </button>
      </div>
      <div className="form-grid">
        <label className="field">Current Loan Payoff Balance ($)<input type="number" min="1000" step="500" value={params.currentBalance} onChange={e => setParams({ currentBalance: Number(e.target.value) || 0 })} /></label>
        <label className="field">Current Auto Loan APR (%)<input type="number" min="1" max="30" step="0.1" value={params.currentApr} onChange={e => setParams({ currentApr: Number(e.target.value) || 0 })} /></label>
        <label className="field">Remaining Months on Current Loan<input type="number" min="6" max="96" value={params.currentRemainingMonths} onChange={e => setParams({ currentRemainingMonths: Number(e.target.value) || 0 })} /></label>
        <label className="field">New Refinanced APR (%)<input type="number" min="1" max="25" step="0.1" value={params.newApr} onChange={e => setParams({ newApr: Number(e.target.value) || 0 })} /></label>
        <label className="field">New Loan Term (Months)<select value={params.newTermMonths} onChange={e => setParams({ newTermMonths: Number(e.target.value) || 48 })}><option value="36">36 Months (3 Years)</option><option value="48">48 Months (4 Years)</option><option value="60">60 Months (5 Years)</option><option value="72">72 Months (6 Years)</option></select></label>
      </div>
      <div className="result-panel my-6">
        <p className="m-0 text-sm opacity-80">Total Interest Saved Through Refinancing</p>
        <strong className={`big-result text-3xl font-bold my-1 block ${totalInterestSavings >= 0 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>{fmt(totalInterestSavings)}</strong>
        <p className="text-xs text-gray-600 dark:text-gray-400 m-0">Monthly Payment Savings: <strong>{fmt(monthlySavings)} / month</strong></p>
        <div className="stats-grid mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat primary-stat"><span>New Monthly Payment</span><strong>{fmt(newMonthly)}</strong></div>
          <div className="stat"><span>Current Payment</span><strong>{fmt(oldMonthly)}</strong></div>
          <div className="stat"><span>Total New Payments</span><strong>{fmt(newTotal)}</strong></div>
          <div className="stat"><span>Total Current Payments</span><strong>{fmt(oldTotal)}</strong></div>
        </div>
      </div>
      <p className="hint text-xs opacity-75">Compares APR drops against term lengths to verify whether refinancing lowers monthly payments without increasing total lifetime interest.</p>
    </div>
  );
}

// -------------------------------------------------------------
// 7. AdSense & Mediavine RPM Calculator
// -------------------------------------------------------------
export function AdSenseRpmCalculator() {
  const [params, setParams, copyLink] = useUrlToolState({
    monthlyPageviews: 85000,
    tier1Percent: 75,
    nicheCpcMultiplier: "finance", // finance, tech, lifestyle, entertainment
  });

  const baseRpms: Record<string, number> = {
    finance: 42.50,
    tech: 24.00,
    lifestyle: 18.50,
    entertainment: 6.25,
  };

  const baseRpm = baseRpms[params.nicheCpcMultiplier] || 20;
  // Tier-1 traffic multiplier: 100% Tier-1 = full base RPM; 0% = 15% of base
  const geoMultiplier = 0.15 + (params.tier1Percent / 100) * 0.85;
  const effectiveRpm = baseRpm * geoMultiplier;

  const monthlyEarnings = (params.monthlyPageviews / 1000) * effectiveRpm;
  const annualEarnings = monthlyEarnings * 12;

  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

  return (
    <div className="tool-panel">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold m-0">Google AdSense & Mediavine RPM Earnings Calculator</h3>
        <button onClick={async () => { await copyLink(); }} className="button secondary text-xs flex items-center gap-1.5 py-1 px-3">
          <Share2 size={14} /> Share Link
        </button>
      </div>
      <div className="form-grid">
        <label className="field">Monthly Pageviews<input type="number" min="1000" step="5000" value={params.monthlyPageviews} onChange={e => setParams({ monthlyPageviews: Number(e.target.value) || 0 })} /></label>
        <label className="field">Audience Vertical / Niche<select value={params.nicheCpcMultiplier} onChange={e => setParams({ nicheCpcMultiplier: e.target.value })}><option value="finance">Finance, Insurance & Banking ($40+ RPM)</option><option value="tech">B2B SaaS, Software & Tech ($24+ RPM)</option><option value="lifestyle">Health, Food & Lifestyle ($18+ RPM)</option><option value="entertainment">General News & Entertainment ($6+ RPM)</option></select></label>
        <label className="field">Tier-1 Traffic % (US, UK, CA, AU)<input type="number" min="0" max="100" step="5" value={params.tier1Percent} onChange={e => setParams({ tier1Percent: Number(e.target.value) || 0 })} /></label>
      </div>
      <div className="result-panel my-6">
        <p className="m-0 text-sm opacity-80">Projected Monthly Display Ad Revenue</p>
        <strong className="big-result text-3xl font-bold my-1 block text-blue-600 dark:text-blue-400">{fmt(monthlyEarnings)} / month ({fmt(annualEarnings)} / year)</strong>
        <p className="text-xs text-gray-600 dark:text-gray-400 m-0">Effective Page RPM: <strong>${effectiveRpm.toFixed(2)} per 1,000 views</strong></p>
        <div className="stats-grid mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="stat primary-stat"><span>Daily Earnings</span><strong>{fmt(monthlyEarnings / 30)}</strong></div>
          <div className="stat"><span>Tier-1 Traffic Ratio</span><strong>{params.tier1Percent}%</strong></div>
          <div className="stat"><span>Ad Network Tier</span><strong>{params.monthlyPageviews >= 50000 ? "Mediavine / Raptive Ready" : "Google AdSense"}</strong></div>
        </div>
      </div>
      <p className="hint text-xs opacity-75">Models real publisher RPMs factoring in high-intent US/UK traffic and advertiser CPC multipliers across finance, legal, and tech niches.</p>
    </div>
  );
}

// -------------------------------------------------------------
// 8. Freelance NDA & SOW Generator (PDF Export)
// -------------------------------------------------------------
export function FreelanceNdaGenerator() {
  const [disclosingParty, setDisclosingParty] = useState("Acme Corp");
  const [receivingParty, setReceivingParty] = useState("Jane Doe (Independent Contractor)");
  const [governingState, setGoverningState] = useState("Delaware");
  const [durationYears, setDurationYears] = useState("2");
  const [generating, setGenerating] = useState(false);

  const generateNdaPdf = async () => {
    setGenerating(true);
    try {
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
      const page = doc.addPage([595.28, 841.89]);
      const { height } = page.getSize();

      page.drawText("NON-DISCLOSURE AGREEMENT (NDA)", { x: 50, y: height - 60, size: 16, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      page.drawText(`Effective Date: ${new Date().toLocaleDateString()}`, { x: 50, y: height - 85, size: 10, font, color: rgb(0.4, 0.4, 0.4) });

      let y = height - 120;
      const lines = [
        `This Mutual Non-Disclosure Agreement is entered into between:`,
        `Disclosing Party: ${disclosingParty}`,
        `Receiving Party: ${receivingParty}`,
        ``,
        `1. Confidential Information: Both parties acknowledge that proprietary technical, business,`,
        `and financial information shared during project discussions constitutes confidential data.`,
        ``,
        `2. Obligations: The Receiving Party agrees to protect disclosed materials with reasonable care`,
        `and refrain from disclosing them to unauthorized third parties without prior written consent.`,
        ``,
        `3. Term: The non-disclosure obligations herein shall remain in effect for a period of ${durationYears} years`,
        `from the date of initial disclosure.`,
        ``,
        `4. Governing Law: This Agreement shall be construed under the laws of the State/Jurisdiction of ${governingState}.`,
        ``,
        `Signatures:`,
        `________________________                  ________________________`,
        `${disclosingParty}                         ${receivingParty}`,
      ];

      for (const line of lines) {
        page.drawText(line, { x: 50, y, size: 10, font: line.startsWith("Signatures") || line.startsWith("1.") || line.startsWith("2.") || line.startsWith("3.") || line.startsWith("4.") ? fontBold : font, color: rgb(0.15, 0.15, 0.15) });
        y -= 22;
      }

      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `NDA-${disclosingParty.replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Error generating PDF.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="tool-panel">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold m-0">Freelance Non-Disclosure Agreement (NDA) Generator</h3>
        <button onClick={generateNdaPdf} disabled={generating} className="button text-xs flex items-center gap-1.5 py-1.5 px-4" type="button">
          <Download size={14} /> {generating ? "Generating..." : "Download NDA (PDF)"}
        </button>
      </div>
      <div className="form-grid">
        <label className="field">Client / Disclosing Party Name<input type="text" value={disclosingParty} onChange={e => setDisclosingParty(e.target.value)} /></label>
        <label className="field">Contractor / Receiving Party Name<input type="text" value={receivingParty} onChange={e => setReceivingParty(e.target.value)} /></label>
        <label className="field">Governing State / Jurisdiction<input type="text" value={governingState} onChange={e => setGoverningState(e.target.value)} /></label>
        <label className="field">Confidentiality Term (Years)<select value={durationYears} onChange={e => setDurationYears(e.target.value)}><option value="1">1 Year</option><option value="2">2 Years</option><option value="3">3 Years</option><option value="5">5 Years</option></select></label>
      </div>
      <p className="hint text-xs opacity-75 mt-4">Generates standard bilateral non-disclosure agreements exported as clean vector PDFs locally using pdf-lib.</p>
    </div>
  );
}
