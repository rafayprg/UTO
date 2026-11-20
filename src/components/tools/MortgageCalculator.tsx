"use client";

import React, { useState } from "react";
import { useUrlToolState } from "@/hooks/useUrlToolState";
import { Share2, Check, Download, Table } from "lucide-react";

interface MortgageState {
  homePrice: number;
  downPayment: number;
  interestRate: number;
  loanTermYears: number;
  propertyTaxRate: number; // annual %
  insuranceAnnual: number;
  pmiRate: number; // annual % on loan amount
  hoaMonthly: number;
}

interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  pmi: number;
  taxInsurance: number;
  balance: number;
  equityPercent: number;
}

export default function MortgageCalculator() {
  const [params, setParams, copyShareableLink] = useUrlToolState<MortgageState>({
    homePrice: 425000,
    downPayment: 42500, // 10%
    interestRate: 6.85,
    loanTermYears: 30,
    propertyTaxRate: 1.2,
    insuranceAnnual: 1500,
    pmiRate: 0.85,
    hoaMonthly: 0,
  });

  const [copied, setCopied] = useState(false);
  const [showTable, setShowTable] = useState(false);

  const handleCopy = async () => {
    const success = await copyShareableLink();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const loanAmount = Math.max(0, params.homePrice - params.downPayment);
  const downPaymentPercent = params.homePrice > 0 ? (params.downPayment / params.homePrice) * 100 : 0;
  const initialLtv = params.homePrice > 0 ? (loanAmount / params.homePrice) * 100 : 0;

  const monthlyRate = params.interestRate / 100 / 12;
  const totalMonths = params.loanTermYears * 12;

  // Monthly Principal & Interest formula
  const monthlyPI =
    loanAmount > 0 && monthlyRate > 0
      ? (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1)
      : loanAmount / (totalMonths || 1);

  const monthlyTax = (params.homePrice * (params.propertyTaxRate / 100)) / 12;
  const monthlyInsurance = params.insuranceAnnual / 12;
  const initialMonthlyPmi = initialLtv > 80 ? (loanAmount * (params.pmiRate / 100)) / 12 : 0;

  // Generate full monthly amortization schedule with PMI cancellation threshold (80% LTV)
  const schedule: AmortizationRow[] = [];
  let currentBalance = loanAmount;
  let pmiDropMonth = -1;
  let totalInterestPaid = 0;
  let totalPmiPaid = 0;

  for (let m = 1; m <= totalMonths && currentBalance > 0; m += 1) {
    const interest = currentBalance * monthlyRate;
    const principal = Math.min(currentBalance, monthlyPI - interest);
    currentBalance = Math.max(0, currentBalance - principal);
    totalInterestPaid += interest;

    const equityPercent = ((params.homePrice - currentBalance) / params.homePrice) * 100;
    let pmi = 0;
    if (equityPercent < 20) {
      pmi = (loanAmount * (params.pmiRate / 100)) / 12;
      totalPmiPaid += pmi;
    } else if (pmiDropMonth === -1) {
      pmiDropMonth = m;
    }

    schedule.push({
      month: m,
      payment: monthlyPI + pmi + monthlyTax + monthlyInsurance + params.hoaMonthly,
      principal,
      interest,
      pmi,
      taxInsurance: monthlyTax + monthlyInsurance,
      balance: currentBalance,
      equityPercent,
    });
  }

  const initialTotalMonthly = monthlyPI + initialMonthlyPmi + monthlyTax + monthlyInsurance + params.hoaMonthly;

  const exportCsv = () => {
    const headers = "Month,Total Payment,Principal,Interest,PMI,Taxes & Insurance,Remaining Balance,Equity %\n";
    const rows = schedule
      .map(
        r =>
          `${r.month},${r.payment.toFixed(2)},${r.principal.toFixed(2)},${r.interest.toFixed(2)},${r.pmi.toFixed(
            2
          )},${r.taxInsurance.toFixed(2)},${r.balance.toFixed(2)},${r.equityPercent.toFixed(1)}%`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `amortization-schedule-${params.homePrice}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatUsd = (num: number) => `$${Math.round(num).toLocaleString()}`;

  return (
    <div className="tool-panel">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold m-0">US Mortgage + PMI + Property Tax Calculator</h3>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className="button secondary text-xs flex items-center gap-1.5 py-1 px-3"
            type="button"
          >
            <Download size={14} /> Export CSV Amortization
          </button>
          <button
            onClick={handleCopy}
            className="button secondary text-xs flex items-center gap-1.5 py-1 px-3"
            type="button"
          >
            {copied ? <Check size={14} className="text-green-600" /> : <Share2 size={14} />}
            {copied ? "Link Copied!" : "Share Link"}
          </button>
        </div>
      </div>

      <div className="form-grid">
        <label className="field">
          Home Purchase Price ($)
          <input
            type="number"
            min="10000"
            step="5000"
            value={params.homePrice}
            onChange={e => setParams({ homePrice: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          Down Payment ($) ({downPaymentPercent.toFixed(1)}%)
          <input
            type="number"
            min="0"
            step="5000"
            value={params.downPayment}
            onChange={e => setParams({ downPayment: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          Interest Rate (% APR)
          <input
            type="number"
            min="0.1"
            max="25"
            step="0.05"
            value={params.interestRate}
            onChange={e => setParams({ interestRate: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          Loan Term (Years)
          <select
            value={params.loanTermYears}
            onChange={e => setParams({ loanTermYears: Number(e.target.value) || 30 })}
          >
            <option value="15">15 Years (Fixed)</option>
            <option value="20">20 Years (Fixed)</option>
            <option value="30">30 Years (Fixed)</option>
          </select>
        </label>
        <label className="field">
          Annual Property Tax Rate (% of price)
          <input
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={params.propertyTaxRate}
            onChange={e => setParams({ propertyTaxRate: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          Annual Homeowners Insurance ($)
          <input
            type="number"
            min="0"
            step="100"
            value={params.insuranceAnnual}
            onChange={e => setParams({ insuranceAnnual: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          Annual PMI Rate (% if under 20% down)
          <input
            type="number"
            min="0"
            max="5"
            step="0.05"
            value={params.pmiRate}
            onChange={e => setParams({ pmiRate: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          Monthly HOA Fees ($)
          <input
            type="number"
            min="0"
            step="25"
            value={params.hoaMonthly}
            onChange={e => setParams({ hoaMonthly: Number(e.target.value) || 0 })}
          />
        </label>
      </div>

      <div className="result-panel my-6" aria-live="polite">
        <p className="m-0 text-sm opacity-80">Estimated Total Monthly Payment (PITI + PMI)</p>
        <strong className="big-result text-3xl font-bold my-1 block text-blue-600 dark:text-blue-400">
          {formatUsd(initialTotalMonthly)}
        </strong>
        <p className="text-xs text-gray-600 dark:text-gray-400 m-0">
          Loan Amount: {formatUsd(loanAmount)} · Initial LTV: {initialLtv.toFixed(1)}% · Lifetime Interest: {formatUsd(totalInterestPaid)}
        </p>

        <div className="stats-grid mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat primary-stat">
            <span>Principal & Interest</span>
            <strong>{formatUsd(monthlyPI)}</strong>
          </div>
          <div className="stat">
            <span>Property Tax</span>
            <strong>{formatUsd(monthlyTax)}</strong>
          </div>
          <div className="stat">
            <span>Home Insurance</span>
            <strong>{formatUsd(monthlyInsurance)}</strong>
          </div>
          <div className="stat">
            <span>PMI ({initialLtv > 80 ? "Active" : "None"})</span>
            <strong>{formatUsd(initialMonthlyPmi)}</strong>
          </div>
        </div>
      </div>

      {initialLtv > 80 && (
        <div className="p-3 bg-amber-50 dark:bg-slate-800 rounded border border-amber-200 dark:border-slate-700 text-xs mb-4 text-amber-900 dark:text-amber-200">
          <strong>PMI Auto-Drop Milestone:</strong> Reaching 20% home equity ($
          {Math.round(params.homePrice * 0.2).toLocaleString()}) occurs at{" "}
          <strong>
            Month {pmiDropMonth > 0 ? `${pmiDropMonth} (Year ${(pmiDropMonth / 12).toFixed(1)})` : "N/A"}
          </strong>
          , dropping your monthly payment by <strong>{formatUsd(initialMonthlyPmi)}</strong>. Total PMI paid:{" "}
          <strong>{formatUsd(totalPmiPaid)}</strong>.
        </div>
      )}

      <div className="flex gap-2 items-center my-3">
        <button
          onClick={() => setShowTable(prev => !prev)}
          className="button secondary text-xs flex items-center gap-1.5 py-1 px-3"
          type="button"
        >
          <Table size={14} /> {showTable ? "Hide Amortization Table" : "View Annual Amortization Table"}
        </button>
      </div>

      {showTable && (
        <div className="table-scroll max-h-72 border rounded-lg p-2 bg-white dark:bg-slate-900 mb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b font-semibold">
                <th className="p-1 text-left">Year</th>
                <th className="p-1 text-right">Principal</th>
                <th className="p-1 text-right">Interest</th>
                <th className="p-1 text-right">PMI</th>
                <th className="p-1 text-right">Remaining Balance</th>
                <th className="p-1 text-right">Equity %</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: params.loanTermYears }, (_, i) => {
                const yearIndex = (i + 1) * 12;
                const row = schedule[yearIndex - 1] || schedule[schedule.length - 1];
                if (!row) return null;
                const yearSlice = schedule.slice(i * 12, (i + 1) * 12);
                const yearPrincipal = yearSlice.reduce((s, r) => s + r.principal, 0);
                const yearInterest = yearSlice.reduce((s, r) => s + r.interest, 0);
                const yearPmi = yearSlice.reduce((s, r) => s + r.pmi, 0);
                return (
                  <tr key={i} className="border-b dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800">
                    <td className="p-1 text-left font-medium">Year {i + 1}</td>
                    <td className="p-1 text-right">{formatUsd(yearPrincipal)}</td>
                    <td className="p-1 text-right">{formatUsd(yearInterest)}</td>
                    <td className="p-1 text-right">{formatUsd(yearPmi)}</td>
                    <td className="p-1 text-right font-semibold">{formatUsd(row.balance)}</td>
                    <td className="p-1 text-right">{row.equityPercent.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="hint text-xs opacity-75">
        Calculates fixed-rate mortgage payments with PITI, PMI cancellation rules, and full amortization schedule export. No personal data collected or stored.
      </p>
    </div>
  );
}
