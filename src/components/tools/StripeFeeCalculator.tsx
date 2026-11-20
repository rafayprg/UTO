"use client";

import React, { useState } from "react";
import { useUrlToolState } from "@/hooks/useUrlToolState";
import { Share2, Check } from "lucide-react";

interface FeeState {
  amount: number;
  percentageRate: number;
  fixedFee: number;
  mode: "forward" | "reverse";
  processor: "stripe" | "paypal" | "shopify" | "custom";
}

const PRESETS = {
  stripe: { name: "Stripe US (2.9% + $0.30)", pct: 2.9, fixed: 0.30 },
  paypal: { name: "PayPal US (3.49% + $0.49)", pct: 3.49, fixed: 0.49 },
  shopify: { name: "Shopify Payments (2.9% + $0.30)", pct: 2.9, fixed: 0.30 },
  custom: { name: "Custom Rate", pct: 2.9, fixed: 0.30 },
};

export default function StripeFeeCalculator() {
  const [params, setParams, copyShareableLink] = useUrlToolState<FeeState>({
    amount: 1000,
    percentageRate: 2.9,
    fixedFee: 0.30,
    mode: "reverse",
    processor: "stripe",
  });

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyShareableLink();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePresetChange = (processor: keyof typeof PRESETS) => {
    setParams({
      processor,
      percentageRate: PRESETS[processor].pct,
      fixedFee: PRESETS[processor].fixed,
    });
  };

  const rateDecimal = params.percentageRate / 100;
  let grossAmount = 0;
  let totalFee = 0;
  let netPayout = 0;

  if (params.mode === "forward") {
    // Deduct fee from transaction
    grossAmount = params.amount;
    totalFee = grossAmount * rateDecimal + params.fixedFee;
    netPayout = Math.max(0, grossAmount - totalFee);
  } else {
    // Reverse: To receive exact net payout
    netPayout = params.amount;
    // Net = Gross * (1 - rate) - fixed => Gross = (Net + fixed) / (1 - rate)
    if (rateDecimal < 1) {
      grossAmount = (netPayout + params.fixedFee) / (1 - rateDecimal);
      totalFee = grossAmount - netPayout;
    }
  }

  const effectiveRate = grossAmount > 0 ? (totalFee / grossAmount) * 100 : 0;
  const formatUsd = (num: number) => `$${num.toFixed(2)}`;

  return (
    <div className="tool-panel">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold m-0">Payment Processor Fee & Reverse Net Calculator</h3>
        <button
          onClick={handleCopy}
          className="button secondary text-xs flex items-center gap-1.5 py-1 px-3"
          type="button"
        >
          {copied ? <Check size={14} className="text-green-600" /> : <Share2 size={14} />}
          {copied ? "Link Copied!" : "Share Link"}
        </button>
      </div>

      <div className="segment-control mb-4" aria-label="Fee calculation mode">
        <button
          aria-pressed={params.mode === "reverse"}
          onClick={() => setParams({ mode: "reverse" })}
        >
          Reverse: Charge Client to Receive Exact Net
        </button>
        <button
          aria-pressed={params.mode === "forward"}
          onClick={() => setParams({ mode: "forward" })}
        >
          Forward: Deduct Fees from Payment
        </button>
      </div>

      <div className="form-grid">
        <label className="field">
          Payment Processor Preset
          <select
            value={params.processor}
            onChange={e => handlePresetChange(e.target.value as keyof typeof PRESETS)}
          >
            {Object.entries(PRESETS).map(([key, val]) => (
              <option key={key} value={key}>
                {val.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          {params.mode === "reverse" ? "Target Net Amount to Receive ($)" : "Customer Payment / Sale Price ($)"}
          <input
            type="number"
            min="1"
            step="10"
            value={params.amount}
            onChange={e => setParams({ amount: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          Percentage Fee (%)
          <input
            type="number"
            min="0"
            max="15"
            step="0.1"
            value={params.percentageRate}
            onChange={e => setParams({ percentageRate: Number(e.target.value) || 0, processor: "custom" })}
          />
        </label>
        <label className="field">
          Fixed Fee per Transaction ($)
          <input
            type="number"
            min="0"
            max="5"
            step="0.05"
            value={params.fixedFee}
            onChange={e => setParams({ fixedFee: Number(e.target.value) || 0, processor: "custom" })}
          />
        </label>
      </div>

      <div className="result-panel my-6" aria-live="polite">
        <p className="m-0 text-sm opacity-80">
          {params.mode === "reverse" ? "Gross Invoice Amount to Bill Client" : "Net Payout Deposited to Bank"}
        </p>
        <strong className="big-result text-3xl font-bold my-1 block text-blue-600 dark:text-blue-400">
          {formatUsd(params.mode === "reverse" ? grossAmount : netPayout)}
        </strong>
        <p className="text-xs text-gray-600 dark:text-gray-400 m-0">
          Total Processing Fee: {formatUsd(totalFee)} (Effective: {effectiveRate.toFixed(2)}%)
        </p>

        <div className="stats-grid mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="stat primary-stat">
            <span>Gross Charge</span>
            <strong>{formatUsd(grossAmount)}</strong>
          </div>
          <div className="stat">
            <span>Processor Fee</span>
            <strong>{formatUsd(totalFee)}</strong>
          </div>
          <div className="stat">
            <span>Net Bank Deposit</span>
            <strong>{formatUsd(netPayout)}</strong>
          </div>
        </div>
      </div>

      <p className="hint text-xs opacity-75">
        Reverse formula: Invoice = (Net + Fixed Fee) ÷ (1 - Percentage Rate). Protects contractor and freelancer margins from payment processor deductions.
      </p>
    </div>
  );
}
