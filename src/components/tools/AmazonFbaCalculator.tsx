"use client";

import React, { useState } from "react";
import { useUrlToolState } from "@/hooks/useUrlToolState";
import { Share2, Check } from "lucide-react";

interface FbaState {
  sellingPrice: number;
  landedCogs: number;
  referralFeePercent: number;
  fbaTier: "small" | "large_1lb" | "large_2lb" | "oversize";
  ppcAcosPercent: number;
  returnsBufferPercent: number;
}

const FBA_TIERS = {
  small: { name: "Small Standard (under 16 oz)", fee: 3.22 },
  large_1lb: { name: "Large Standard (up to 1 lb)", fee: 3.86 },
  large_2lb: { name: "Large Standard (1 to 2 lbs)", fee: 4.75 },
  oversize: { name: "Small Oversize", fee: 9.73 },
};

export default function AmazonFbaCalculator() {
  const [params, setParams, copyShareableLink] = useUrlToolState<FbaState>({
    sellingPrice: 34.99,
    landedCogs: 8.50,
    referralFeePercent: 15.0,
    fbaTier: "large_1lb",
    ppcAcosPercent: 12.0,
    returnsBufferPercent: 3.0,
  });

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyShareableLink();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const referralFee = params.sellingPrice * (params.referralFeePercent / 100);
  const fulfillmentFee = FBA_TIERS[params.fbaTier].fee;
  const ppcCostPerUnit = params.sellingPrice * (params.ppcAcosPercent / 100);
  const returnsReserve = params.sellingPrice * (params.returnsBufferPercent / 100);

  const totalAmazonFees = referralFee + fulfillmentFee;
  const totalCostPerUnit = params.landedCogs + totalAmazonFees + ppcCostPerUnit + returnsReserve;
  const netProfit = params.sellingPrice - totalCostPerUnit;
  const netMargin = params.sellingPrice > 0 ? (netProfit / params.sellingPrice) * 100 : 0;
  const roi = params.landedCogs > 0 ? (netProfit / params.landedCogs) * 100 : 0;

  const formatUsd = (num: number) => `$${num.toFixed(2)}`;

  return (
    <div className="tool-panel">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold m-0">Amazon FBA Revenue, Fees & Net Margin Calculator</h3>
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
          Amazon Retail Selling Price ($)
          <input
            type="number"
            min="1"
            step="1"
            value={params.sellingPrice}
            onChange={e => setParams({ sellingPrice: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          Landed COGS (Manufacturing + Freight) ($)
          <input
            type="number"
            min="0"
            step="0.5"
            value={params.landedCogs}
            onChange={e => setParams({ landedCogs: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          FBA Fulfillment Size Tier
          <select
            value={params.fbaTier}
            onChange={e => setParams({ fbaTier: e.target.value as keyof typeof FBA_TIERS })}
          >
            {Object.entries(FBA_TIERS).map(([key, val]) => (
              <option key={key} value={key}>
                {val.name} (${val.fee.toFixed(2)})
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Amazon Referral Fee (% of retail)
          <input
            type="number"
            min="6"
            max="45"
            step="1"
            value={params.referralFeePercent}
            onChange={e => setParams({ referralFeePercent: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          Target PPC ACoS (% of revenue)
          <input
            type="number"
            min="0"
            max="60"
            step="1"
            value={params.ppcAcosPercent}
            onChange={e => setParams({ ppcAcosPercent: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          Returns & Storage Reserve (%)
          <input
            type="number"
            min="0"
            max="15"
            step="0.5"
            value={params.returnsBufferPercent}
            onChange={e => setParams({ returnsBufferPercent: Number(e.target.value) || 0 })}
          />
        </label>
      </div>

      <div className="result-panel my-6" aria-live="polite">
        <p className="m-0 text-sm opacity-80">Estimated Net Profit per Unit Sold</p>
        <strong className={`big-result text-3xl font-bold my-1 block ${netProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {formatUsd(netProfit)}
        </strong>
        <p className="text-xs text-gray-600 dark:text-gray-400 m-0">
          Net Profit Margin: <strong>{netMargin.toFixed(1)}%</strong> · ROI on Inventory: <strong>{roi.toFixed(1)}%</strong>
        </p>

        <div className="stats-grid mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat primary-stat">
            <span>Amazon FBA Fee</span>
            <strong>{formatUsd(fulfillmentFee)}</strong>
          </div>
          <div className="stat">
            <span>Referral Fee ({params.referralFeePercent}%)</span>
            <strong>{formatUsd(referralFee)}</strong>
          </div>
          <div className="stat">
            <span>PPC Ad Spend/Unit</span>
            <strong>{formatUsd(ppcCostPerUnit)}</strong>
          </div>
          <div className="stat">
            <span>Total Amazon Take</span>
            <strong>{formatUsd(totalAmazonFees)}</strong>
          </div>
        </div>
      </div>

      <p className="hint text-xs opacity-75">
        Calculates Amazon FBA unit economics taking into account size tiers, referral fees, PPC advertising cost of sales (ACoS), and return reserves.
      </p>
    </div>
  );
}
