"use client";

import { useState, useMemo } from "react";
import { PAYMENT_PLATFORMS } from "@/data/programmatic/payment-platforms";
import type { ToolDefinition } from "@/lib/tools-registry";
import { ShieldCheck } from "lucide-react";

interface PresetData {
  platformId?: string;
  calcMode?: "fee" | "reverse" | "margin";
}

export default function PlatformFeeEngine({ tool }: { tool: ToolDefinition }) {
  const preset = (tool.preset || {}) as PresetData;
  const initialPlatformId = preset.platformId || "stripe";

  const [platformId, setPlatformId] = useState<string>(initialPlatformId);
  const [salePrice, setSalePrice] = useState<number>(100);
  const [itemCost, setItemCost] = useState<number>(30);
  const [shippingCharge, setShippingCharge] = useState<number>(0);
  const [isInternational, setIsInternational] = useState<boolean>(false);
  const [targetNet, setTargetNet] = useState<number>(100);

  const platform = useMemo(() => {
    return PAYMENT_PLATFORMS.find((p) => p.id === platformId) || PAYMENT_PLATFORMS[0];
  }, [platformId]);

  const activePercent = isInternational ? platform.intlPercent : platform.domesticPercent;
  const activeFixed = isInternational ? platform.intlFixed : platform.domesticFixed;

  // Forward calculations
  const forwardCalc = useMemo(() => {
    const totalTransaction = salePrice + shippingCharge;
    const feeAmount = totalTransaction * (activePercent / 100) + activeFixed;
    const netPayout = Math.max(0, totalTransaction - feeAmount);
    const netProfit = netPayout - itemCost;
    const profitMargin = totalTransaction > 0 ? (netProfit / totalTransaction) * 100 : 0;
    const effectiveFeeRate = totalTransaction > 0 ? (feeAmount / totalTransaction) * 100 : 0;

    return {
      totalTransaction,
      feeAmount,
      netPayout,
      netProfit,
      profitMargin,
      effectiveFeeRate,
    };
  }, [salePrice, shippingCharge, itemCost, activePercent, activeFixed]);

  // Reverse calculation: Required price to net targetNet
  // targetNet = Price - (Price * P% + F) => Price * (1 - P%) = targetNet + F => Price = (targetNet + F) / (1 - P%)
  const reverseCalc = useMemo(() => {
    const pDecimal = activePercent / 100;
    if (pDecimal >= 1) return { requiredPrice: 0, feeAmount: 0 };
    const requiredPrice = (targetNet + activeFixed) / (1 - pDecimal);
    const feeAmount = requiredPrice - targetNet;
    return { requiredPrice, feeAmount };
  }, [targetNet, activePercent, activeFixed]);

  return (
    <div className="platform-fee-engine">
      {/* Platform Header & Selector */}
      <div className="engine-card">
        <div className="card-row-between">
          <div>
            <h3 style={{ margin: 0, fontSize: "16px" }}>{platform.name} Fee Structure</h3>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b" }}>
              {platform.domesticPercent}% + ${platform.domesticFixed.toFixed(2)} (Domestic) · {platform.intlPercent}% + ${platform.intlFixed.toFixed(2)} (International)
            </p>
          </div>

          <label className="state-select-label">
            Switch Platform:
            <select
              value={platformId}
              onChange={(e) => setPlatformId(e.target.value)}
              className="state-select"
            >
              {PAYMENT_PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.domesticPercent}% + ${p.domesticFixed})
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="calc-layout-grid">
        {/* Left Inputs */}
        <div className="input-panel">
          <h3>Transaction Details</h3>
          <div className="field-group">
            <label>Sale Price / Order Value ($)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={salePrice}
              onChange={(e) => setSalePrice(Number(e.target.value) || 0)}
            />
          </div>

          <div className="field-group">
            <label>Cost of Goods / Item Cost ($) (Optional)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={itemCost}
              onChange={(e) => setItemCost(Number(e.target.value) || 0)}
            />
          </div>

          <div className="field-group">
            <label>Shipping Charged to Customer ($)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={shippingCharge}
              onChange={(e) => setShippingCharge(Number(e.target.value) || 0)}
            />
          </div>

          <div className="field-group checkbox-group" style={{ marginTop: "14px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={isInternational}
                onChange={(e) => setIsInternational(e.target.checked)}
              />
              <span>International / Cross-Border Transaction (+{platform.intlPercent - platform.domesticPercent}% fee)</span>
            </label>
          </div>
        </div>

        {/* Right Output */}
        <div className="results-panel">
          <h3>{platform.name} Payout & Fee Summary</h3>
          <div className="metric-highlight">
            <span>Net Amount You Keep</span>
            <strong>${forwardCalc.netPayout.toFixed(2)}</strong>
          </div>

          <div className="breakdown-table">
            <div className="table-row">
              <span>Gross Customer Paid:</span>
              <span>${forwardCalc.totalTransaction.toFixed(2)}</span>
            </div>
            <div className="table-row">
              <span>{platform.name} Fee ({activePercent}% + ${activeFixed.toFixed(2)}):</span>
              <span className="negative-val">-${forwardCalc.feeAmount.toFixed(2)}</span>
            </div>
            <div className="table-row">
              <span>Effective Processing Rate:</span>
              <span>{forwardCalc.effectiveFeeRate.toFixed(2)}%</span>
            </div>
            {itemCost > 0 && (
              <>
                <div className="table-row">
                  <span>Product Cost:</span>
                  <span className="negative-val">-${itemCost.toFixed(2)}</span>
                </div>
                <div className="table-row total-row">
                  <span>Clean Profit:</span>
                  <strong style={{ color: forwardCalc.netProfit >= 0 ? "#16a34a" : "#dc2626" }}>
                    ${forwardCalc.netProfit.toFixed(2)} ({forwardCalc.profitMargin.toFixed(1)}% margin)
                  </strong>
                </div>
              </>
            )}
          </div>

          {/* Reverse Fee Tool Box */}
          <div className="reverse-calc-box" style={{ marginTop: "24px", padding: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
            <h4 style={{ margin: "0 0 8px", fontSize: "14px" }}>Target Payout Calculator (Reverse Net)</h4>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", color: "#64748b" }}>To keep exactly:</label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={targetNet}
                  onChange={(e) => setTargetNet(Number(e.target.value) || 0)}
                  style={{ width: "100%", padding: "6px 10px", marginTop: "4px" }}
                />
              </div>
              <div style={{ flex: 1.5, paddingLeft: "10px", borderLeft: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "12px", color: "#64748b" }}>You should charge:</span>
                <strong style={{ display: "block", fontSize: "18px", color: "#2563eb", marginTop: "2px" }}>
                  ${reverseCalc.requiredPrice.toFixed(2)}
                </strong>
                <small style={{ fontSize: "11px", color: "#94a3b8" }}>Fee: ${reverseCalc.feeAmount.toFixed(2)}</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="engine-footer-note">
        <ShieldCheck size={16} />
        <span>Payout schedule: {platform.payoutSchedule}. Calculated client-side with zero tracking or remote API requests.</span>
      </div>
    </div>
  );
}
