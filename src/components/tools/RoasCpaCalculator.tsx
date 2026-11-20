"use client";

import React, { useState } from "react";
import { useUrlToolState } from "@/hooks/useUrlToolState";
import { Share2, Check } from "lucide-react";

interface RoasState {
  adSpend: number;
  cpc: number;
  conversionRatePercent: number;
  aov: number;
  productGrossMarginPercent: number;
}

export default function RoasCpaCalculator() {
  const [params, setParams, copyShareableLink] = useUrlToolState<RoasState>({
    adSpend: 5000,
    cpc: 2.25,
    conversionRatePercent: 3.2,
    aov: 110,
    productGrossMarginPercent: 65,
  });

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyShareableLink();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const clicks = params.cpc > 0 ? params.adSpend / params.cpc : 0;
  const orders = clicks * (params.conversionRatePercent / 100);
  const revenue = orders * params.aov;
  const roas = params.adSpend > 0 ? revenue / params.adSpend : 0;

  const actualCpa = orders > 0 ? params.adSpend / orders : 0;
  const grossMarginDecimal = params.productGrossMarginPercent / 100;

  // Break-even ROAS = 1 / Gross Margin
  const breakEvenRoas = grossMarginDecimal > 0 ? 1 / grossMarginDecimal : 1;

  // Max Target CPA = AOV * Gross Margin
  const maxTargetCpa = params.aov * grossMarginDecimal;

  // Net Profit after ad spend and COGS
  const grossProfit = revenue * grossMarginDecimal;
  const netAdProfit = grossProfit - params.adSpend;

  const formatUsd = (num: number) => `$${Math.round(num).toLocaleString()}`;

  return (
    <div className="tool-panel">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold m-0">Google Ads ROAS & Break-Even CPA Calculator</h3>
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
          Total Ad Spend ($)
          <input
            type="number"
            min="100"
            step="500"
            value={params.adSpend}
            onChange={e => setParams({ adSpend: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          Average Cost Per Click (CPC) ($)
          <input
            type="number"
            min="0.1"
            max="100"
            step="0.1"
            value={params.cpc}
            onChange={e => setParams({ cpc: Number(e.target.value) || 0.1 })}
          />
        </label>
        <label className="field">
          Landing Page Conversion Rate (%)
          <input
            type="number"
            min="0.1"
            max="50"
            step="0.1"
            value={params.conversionRatePercent}
            onChange={e => setParams({ conversionRatePercent: Number(e.target.value) || 0.1 })}
          />
        </label>
        <label className="field">
          Average Order Value (AOV) ($)
          <input
            type="number"
            min="1"
            step="5"
            value={params.aov}
            onChange={e => setParams({ aov: Number(e.target.value) || 1 })}
          />
        </label>
        <label className="field">
          Product Gross Margin (%)
          <input
            type="number"
            min="5"
            max="100"
            step="1"
            value={params.productGrossMarginPercent}
            onChange={e => setParams({ productGrossMarginPercent: Number(e.target.value) || 10 })}
          />
        </label>
      </div>

      <div className="result-panel my-6" aria-live="polite">
        <p className="m-0 text-sm opacity-80">Campaign Return on Ad Spend (ROAS)</p>
        <strong className={`big-result text-3xl font-bold my-1 block ${roas >= breakEvenRoas ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
          {roas.toFixed(2)}x ({roas >= breakEvenRoas ? "Profitable" : "Below Break-Even"})
        </strong>
        <p className="text-xs text-gray-600 dark:text-gray-400 m-0">
          Break-Even ROAS Threshold: <strong>{breakEvenRoas.toFixed(2)}x</strong> · Max Target CPA: <strong>{formatUsd(maxTargetCpa)}</strong>
        </p>

        <div className="stats-grid mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat primary-stat">
            <span>Net Campaign Profit</span>
            <strong>{formatUsd(netAdProfit)}</strong>
          </div>
          <div className="stat">
            <span>Actual CPA</span>
            <strong>{formatUsd(actualCpa)}</strong>
          </div>
          <div className="stat">
            <span>Estimated Orders</span>
            <strong>{Math.round(orders).toLocaleString()}</strong>
          </div>
          <div className="stat">
            <span>Gross Revenue</span>
            <strong>{formatUsd(revenue)}</strong>
          </div>
        </div>
      </div>

      <p className="hint text-xs opacity-75">
        Break-even ROAS = 1 ÷ Gross Margin. Max Target CPA = AOV × Gross Margin. Any customer acquisition cost lower than your Max CPA generates net profit.
      </p>
    </div>
  );
}
