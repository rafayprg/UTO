"use client";

import React, { useState } from "react";
import { useUrlToolState } from "@/hooks/useUrlToolState";
import { US_STATE_TAXES, calculateStateTax } from "@/data/us-state-taxes";
import { Share2, Check } from "lucide-react";

interface TaxState {
  gross: number;
  expenses: number;
  stateCode: string;
  filingStatus: "single" | "married";
}

const FEDERAL_BRACKETS_2025_SINGLE = [
  { threshold: 0, rate: 0.10 },
  { threshold: 11925, rate: 0.12 },
  { threshold: 48475, rate: 0.22 },
  { threshold: 103350, rate: 0.24 },
  { threshold: 197300, rate: 0.32 },
  { threshold: 250525, rate: 0.35 },
  { threshold: 626350, rate: 0.37 },
];

const FEDERAL_BRACKETS_2025_MARRIED = [
  { threshold: 0, rate: 0.10 },
  { threshold: 23850, rate: 0.12 },
  { threshold: 96950, rate: 0.22 },
  { threshold: 206700, rate: 0.24 },
  { threshold: 394600, rate: 0.32 },
  { threshold: 501050, rate: 0.35 },
  { threshold: 751600, rate: 0.37 },
];

const STANDARD_DEDUCTION_2025 = {
  single: 15000,
  married: 30000,
};

const SS_WAGE_BASE_2025 = 176100;

export default function Tax1099Calculator() {
  const [params, setParams, copyShareableLink] = useUrlToolState<TaxState>({
    gross: 95000,
    expenses: 12000,
    stateCode: "TX",
    filingStatus: "single",
  });

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyShareableLink();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const netEarnings = Math.max(0, params.gross - params.expenses);
  const seTaxableBase = netEarnings * 0.9235;

  // Social security (12.4% up to cap) + Medicare (2.9% uncapped)
  const ssTax = Math.min(seTaxableBase, SS_WAGE_BASE_2025) * 0.124;
  const medicareTax = seTaxableBase * 0.029;
  const seTax = ssTax + medicareTax;

  // Deduct 50% of SE tax from AGI
  const seDeduction = seTax * 0.5;

  // QBI deduction (20% of net profit after SE tax deduction, simplified safe harbor)
  const qbiDeduction = Math.max(0, netEarnings - seDeduction) * 0.20;

  // Federal taxable income
  const stdDeduction = STANDARD_DEDUCTION_2025[params.filingStatus];
  const federalTaxable = Math.max(0, netEarnings - seDeduction - qbiDeduction - stdDeduction);

  // Progressive Federal Income Tax
  const brackets = params.filingStatus === "married" ? FEDERAL_BRACKETS_2025_MARRIED : FEDERAL_BRACKETS_2025_SINGLE;
  let federalIncomeTax = 0;
  for (let i = 0; i < brackets.length; i += 1) {
    const cur = brackets[i];
    const next = brackets[i + 1];
    if (federalTaxable > cur.threshold) {
      const taxableInBracket = next ? Math.min(federalTaxable, next.threshold) - cur.threshold : federalTaxable - cur.threshold;
      federalIncomeTax += taxableInBracket * cur.rate;
    }
  }

  // State Income Tax calculation
  const stateResult = calculateStateTax(params.stateCode, Math.max(0, netEarnings - seDeduction - stdDeduction));
  const stateTax = stateResult.tax;

  const totalTax = seTax + federalIncomeTax + stateTax;
  const netTakeHome = netEarnings - totalTax;
  const effectiveTaxRate = netEarnings > 0 ? (totalTax / netEarnings) * 100 : 0;
  const quarterlyPayment = totalTax / 4;

  const formatUsd = (num: number) => `$${Math.round(num).toLocaleString()}`;

  return (
    <div className="tool-panel">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold m-0">2025–2026 US 1099 Freelance Tax Calculator</h3>
        <button
          onClick={handleCopy}
          className="button secondary text-xs flex items-center gap-1.5 py-1 px-3"
          type="button"
        >
          {copied ? <Check size={14} className="text-green-600" /> : <Share2 size={14} />}
          {copied ? "Link Copied!" : "Copy Shareable Link"}
        </button>
      </div>

      <div className="form-grid">
        <label className="field">
          Annual Gross Freelance Revenue ($)
          <input
            type="number"
            min="0"
            step="1000"
            value={params.gross}
            onChange={e => setParams({ gross: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          Deductible Business Expenses ($)
          <input
            type="number"
            min="0"
            step="500"
            value={params.expenses}
            onChange={e => setParams({ expenses: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          State of Residence
          <select
            value={params.stateCode}
            onChange={e => setParams({ stateCode: e.target.value })}
          >
            {Object.values(US_STATE_TAXES).map(s => (
              <option key={s.code} value={s.code}>
                {s.name} ({s.code}) - {s.type === "none" ? "No State Tax" : `${(s.rate * 100).toFixed(1)}%`}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Tax Filing Status
          <select
            value={params.filingStatus}
            onChange={e => setParams({ filingStatus: e.target.value as "single" | "married" })}
          >
            <option value="single">Single ($15,000 Std Ded)</option>
            <option value="married">Married Filing Jointly ($30,000 Std Ded)</option>
          </select>
        </label>
      </div>

      <div className="result-panel my-6" aria-live="polite">
        <p className="m-0 text-sm opacity-80">Estimated Total Tax (Federal + SE + State)</p>
        <strong className="big-result text-3xl font-bold my-1 block text-blue-600 dark:text-blue-400">
          {formatUsd(totalTax)}
        </strong>
        <p className="text-xs text-gray-600 dark:text-gray-400 m-0">
          Effective Tax Rate: <strong>{effectiveTaxRate.toFixed(1)}%</strong> of net profit
        </p>

        <div className="stats-grid mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat primary-stat">
            <span>Net Take-Home</span>
            <strong>{formatUsd(netTakeHome)}</strong>
          </div>
          <div className="stat">
            <span>Self-Employment (15.3%)</span>
            <strong>{formatUsd(seTax)}</strong>
          </div>
          <div className="stat">
            <span>Federal Income Tax</span>
            <strong>{formatUsd(federalIncomeTax)}</strong>
          </div>
          <div className="stat">
            <span>State Income Tax</span>
            <strong>{formatUsd(stateTax)}</strong>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-slate-800 p-4 rounded-lg border border-blue-100 dark:border-slate-700 mb-4">
        <h4 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-200">
          Estimated Quarterly IRS Payments (Form 1040-ES)
        </h4>
        <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">
          Set aside <strong>{formatUsd(quarterlyPayment)}</strong> per quarter to avoid IRS underpayment penalties:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2 bg-white dark:bg-slate-900 rounded border border-blue-200 dark:border-slate-600">
            <strong>Q1: Apr 15, 2026</strong>
            <div className="text-blue-600 font-bold">{formatUsd(quarterlyPayment)}</div>
          </div>
          <div className="p-2 bg-white dark:bg-slate-900 rounded border border-blue-200 dark:border-slate-600">
            <strong>Q2: Jun 15, 2026</strong>
            <div className="text-blue-600 font-bold">{formatUsd(quarterlyPayment)}</div>
          </div>
          <div className="p-2 bg-white dark:bg-slate-900 rounded border border-blue-200 dark:border-slate-600">
            <strong>Q3: Sep 15, 2026</strong>
            <div className="text-blue-600 font-bold">{formatUsd(quarterlyPayment)}</div>
          </div>
          <div className="p-2 bg-white dark:bg-slate-900 rounded border border-blue-200 dark:border-slate-600">
            <strong>Q4: Jan 15, 2027</strong>
            <div className="text-blue-600 font-bold">{formatUsd(quarterlyPayment)}</div>
          </div>
        </div>
      </div>

      <p className="hint text-xs opacity-75">
        Includes standard 15.3% Self-Employment tax on 92.35% net profit, Section 199A QBI 20% deduction, standard deduction, and state bracket calculations. Pure client-side math; zero data leaves your browser.
      </p>
    </div>
  );
}
