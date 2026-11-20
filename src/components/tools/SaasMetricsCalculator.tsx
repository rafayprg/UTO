"use client";

import React, { useState } from "react";
import { useUrlToolState } from "@/hooks/useUrlToolState";
import { Share2, Check } from "lucide-react";

interface SaasState {
  mrr: number;
  customers: number;
  monthlyChurnPercent: number;
  grossMarginPercent: number;
  monthlySmSpend: number;
  newCustomersMonthly: number;
  cashBank: number;
  monthlyOperatingExpenses: number;
}

export default function SaasMetricsCalculator() {
  const [params, setParams, copyShareableLink] = useUrlToolState<SaasState>({
    mrr: 45000,
    customers: 300,
    monthlyChurnPercent: 2.5,
    grossMarginPercent: 82.0,
    monthlySmSpend: 15000,
    newCustomersMonthly: 35,
    cashBank: 350000,
    monthlyOperatingExpenses: 65000,
  });

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyShareableLink();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const arpa = params.customers > 0 ? params.mrr / params.customers : 0;
  const churnDecimal = Math.max(0.001, params.monthlyChurnPercent / 100);
  const marginDecimal = params.grossMarginPercent / 100;

  // LTV = (ARPA * Gross Margin) / Monthly Churn
  const ltv = (arpa * marginDecimal) / churnDecimal;

  // CAC = S&M Spend / New Customers
  const cac = params.newCustomersMonthly > 0 ? params.monthlySmSpend / params.newCustomersMonthly : 0;

  // LTV:CAC Ratio
  const ltvCacRatio = cac > 0 ? ltv / cac : 0;

  // CAC Payback in Months = CAC / (ARPA * Gross Margin)
  const monthlyGrossProfitPerCustomer = arpa * marginDecimal;
  const cacPaybackMonths = monthlyGrossProfitPerCustomer > 0 ? cac / monthlyGrossProfitPerCustomer : 0;

  // Net Burn & Runway
  const grossProfit = params.mrr * marginDecimal;
  const netMonthlyBurn = Math.max(0, params.monthlyOperatingExpenses - grossProfit);
  const runwayMonths = netMonthlyBurn > 0 ? params.cashBank / netMonthlyBurn : Infinity;

  const formatUsd = (num: number) => `$${Math.round(num).toLocaleString()}`;

  return (
    <div className="tool-panel">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold m-0">SaaS Metrics, LTV:CAC & Burn Runway Calculator</h3>
        <button
          onClick={handleCopy}
          className="button secondary text-xs flex items-center gap-1.5 py-1 px-3"
          type="button"
        >
          {copied ? <Check size={14} className="text-green-600" /> : <Share2 size={14} />}
          {copied ? "Link Copied!" : "Share Link"}
        </button>
      </div>

      <div className="form-grid">
        <label className="field">
          Monthly Recurring Revenue (MRR) ($)
          <input
            type="number"
            min="0"
            step="1000"
            value={params.mrr}
            onChange={e => setParams({ mrr: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          Active Paying Customers
          <input
            type="number"
            min="1"
            step="10"
            value={params.customers}
            onChange={e => setParams({ customers: Number(e.target.value) || 1 })}
          />
        </label>
        <label className="field">
          Monthly Customer Churn Rate (%)
          <input
            type="number"
            min="0.1"
            max="50"
            step="0.1"
            value={params.monthlyChurnPercent}
            onChange={e => setParams({ monthlyChurnPercent: Number(e.target.value) || 0.1 })}
          />
        </label>
        <label className="field">
          Gross Margin (%)
          <input
            type="number"
            min="10"
            max="100"
            step="1"
            value={params.grossMarginPercent}
            onChange={e => setParams({ grossMarginPercent: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          Monthly Sales & Marketing Spend ($)
          <input
            type="number"
            min="0"
            step="1000"
            value={params.monthlySmSpend}
            onChange={e => setParams({ monthlySmSpend: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          New Customers Acquired / Month
          <input
            type="number"
            min="1"
            step="5"
            value={params.newCustomersMonthly}
            onChange={e => setParams({ newCustomersMonthly: Number(e.target.value) || 1 })}
          />
        </label>
        <label className="field">
          Cash Reserves in Bank ($)
          <input
            type="number"
            min="0"
            step="10000"
            value={params.cashBank}
            onChange={e => setParams({ cashBank: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          Total Monthly Operating Expenses ($)
          <input
            type="number"
            min="0"
            step="5000"
            value={params.monthlyOperatingExpenses}
            onChange={e => setParams({ monthlyOperatingExpenses: Number(e.target.value) || 0 })}
          />
        </label>
      </div>

      <div className="result-panel my-6" aria-live="polite">
        <p className="m-0 text-sm opacity-80">Customer Lifetime Value to CAC Ratio</p>
        <strong className={`big-result text-3xl font-bold my-1 block ${ltvCacRatio >= 3 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
          {ltvCacRatio.toFixed(1)} : 1 ({ltvCacRatio >= 3 ? "Healthy Scale" : "High Acquisition Cost"})
        </strong>
        <p className="text-xs text-gray-600 dark:text-gray-400 m-0">
          CAC Payback Period: <strong>{cacPaybackMonths.toFixed(1)} months</strong> (Target: &lt; 12 mo)
        </p>

        <div className="stats-grid mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat primary-stat">
            <span>Customer LTV</span>
            <strong>{formatUsd(ltv)}</strong>
          </div>
          <div className="stat">
            <span>Blended CAC</span>
            <strong>{formatUsd(cac)}</strong>
          </div>
          <div className="stat">
            <span>Net Monthly Burn</span>
            <strong>{netMonthlyBurn > 0 ? formatUsd(netMonthlyBurn) : "$0 (Profitable)"}</strong>
          </div>
          <div className="stat">
            <span>Cash Runway</span>
            <strong>{runwayMonths === Infinity ? "Infinite" : `${runwayMonths.toFixed(1)} Months`}</strong>
          </div>
        </div>
      </div>

      <p className="hint text-xs opacity-75">
        Calculates core SaaS venture benchmarks: ARPA, LTV, CAC, CAC Payback, Net Burn, and Runway. Target healthy benchmarks: LTV:CAC &gt;= 3.0x, CAC payback &lt; 12 months.
      </p>
    </div>
  );
}
