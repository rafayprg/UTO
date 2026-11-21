"use client";

import { useState, useMemo } from "react";
import { TIER1_COUNTRIES } from "@/data/programmatic/tier1-countries";
import type { ToolDefinition } from "@/lib/tools-registry";
import { ShieldCheck } from "lucide-react";

interface PresetData {
  countryKey?: "uk" | "canada" | "australia" | "newzealand";
  calcMode?: "income_tax" | "vat_gst";
}

export default function Tier1CountryFinanceEngine({ tool }: { tool: ToolDefinition }) {
  const preset = (tool.preset || {}) as PresetData;
  const initialCountry = preset.countryKey || "uk";
  const mode = preset.calcMode || "income_tax";

  const [countryKey, setCountryKey] = useState<string>(initialCountry);
  const [selectedSubRegion, setSelectedSubRegion] = useState<string>("");
  const [grossIncome, setGrossIncome] = useState<number>(60000);
  const [preTaxAmount, setPreTaxAmount] = useState<number>(100);

  const country = useMemo(() => {
    return TIER1_COUNTRIES[countryKey] || TIER1_COUNTRIES.uk;
  }, [countryKey]);

  // Set subregion default if exists
  const activeSubRegion = useMemo(() => {
    if (!country.subRegions || country.subRegions.length === 0) return null;
    return country.subRegions.find((r) => r.slug === selectedSubRegion) || country.subRegions[0];
  }, [country, selectedSubRegion]);

  const activeVatRate = activeSubRegion ? activeSubRegion.vatRate : country.defaultVatRate;

  // Income Tax calculation
  const incomeTaxCalc = useMemo(() => {
    let incomeTax = 0;
    for (let i = 0; i < country.brackets.length; i++) {
      const b = country.brackets[i];
      const next = country.brackets[i + 1];
      if (grossIncome > b.threshold) {
        const taxableChunk = next ? Math.min(grossIncome - b.threshold, next.threshold - b.threshold) : grossIncome - b.threshold;
        incomeTax += taxableChunk * b.rate;
      }
    }

    const socialSecurity = grossIncome * (country.socialSecurityRate / 100);
    const totalDeductions = incomeTax + socialSecurity;
    const netIncome = Math.max(0, grossIncome - totalDeductions);
    const effectiveRate = grossIncome > 0 ? (totalDeductions / grossIncome) * 100 : 0;

    return {
      incomeTax,
      socialSecurity,
      totalDeductions,
      netIncome,
      effectiveRate,
      monthlyTakeHome: netIncome / 12,
    };
  }, [grossIncome, country]);

  // VAT/GST Calculation
  const vatCalc = useMemo(() => {
    const taxAmount = preTaxAmount * (activeVatRate / 100);
    const totalAmount = preTaxAmount + taxAmount;
    // Reverse calculation (from gross to net)
    const netFromGross = preTaxAmount / (1 + activeVatRate / 100);
    const taxIncluded = preTaxAmount - netFromGross;
    return { taxAmount, totalAmount, netFromGross, taxIncluded };
  }, [preTaxAmount, activeVatRate]);

  return (
    <div className="tier1-country-engine">
      <div className="engine-card">
        <div className="card-row-between">
          <div>
            <h3 style={{ margin: 0, fontSize: "16px" }}>{country.countryName} Fiscal Calculator</h3>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b" }}>
              Currency: {country.currencyCode} ({country.currencySymbol}) · {country.vatGstName}: {activeVatRate}%
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            {country.subRegions && country.subRegions.length > 0 && (
              <label className="state-select-label">
                Province / State:
                <select
                  value={activeSubRegion?.slug || ""}
                  onChange={(e) => setSelectedSubRegion(e.target.value)}
                  className="state-select"
                >
                  {country.subRegions.map((r) => (
                    <option key={r.slug} value={r.slug}>
                      {r.name} ({r.vatRate}% {r.provincialTaxType || ""})
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="state-select-label">
              Country:
              <select
                value={countryKey}
                onChange={(e) => {
                  setCountryKey(e.target.value);
                  setSelectedSubRegion("");
                }}
                className="state-select"
              >
                {Object.keys(TIER1_COUNTRIES).map((key) => (
                  <option key={key} value={key}>
                    {TIER1_COUNTRIES[key].countryName}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      {mode === "vat_gst" ? (
        <div className="calc-layout-grid">
          <div className="input-panel">
            <h3>{country.vatGstName} Calculation</h3>
            <div className="field-group">
              <label>Amount ({country.currencySymbol})</label>
              <input
                type="number"
                min="0"
                step="5"
                value={preTaxAmount}
                onChange={(e) => setPreTaxAmount(Number(e.target.value) || 0)}
              />
            </div>
            <div className="field-group">
              <label>Applicable Rate: {activeVatRate}%</label>
              <p className="field-hint">
                {activeSubRegion ? `${activeSubRegion.name} combined statutory rate.` : `National standard rate for ${country.countryName}.`}
              </p>
            </div>
          </div>

          <div className="results-panel">
            <h3>{country.vatGstName} Results</h3>
            <div className="metric-highlight">
              <span>Gross Total (Including Tax)</span>
              <strong>
                {country.currencySymbol}
                {vatCalc.totalAmount.toFixed(2)}
              </strong>
            </div>

            <div className="breakdown-table">
              <div className="table-row">
                <span>Net Price (Excluding Tax):</span>
                <span>
                  {country.currencySymbol}
                  {preTaxAmount.toFixed(2)}
                </span>
              </div>
              <div className="table-row">
                <span>{country.vatGstName} Added ({activeVatRate}%):</span>
                <span className="negative-val">
                  +{country.currencySymbol}
                  {vatCalc.taxAmount.toFixed(2)}
                </span>
              </div>
              <div className="table-row total-row">
                <span>If {country.currencySymbol}{preTaxAmount} is Already Gross:</span>
                <span>
                  Net: {country.currencySymbol}{vatCalc.netFromGross.toFixed(2)} (Tax: {country.currencySymbol}{vatCalc.taxIncluded.toFixed(2)})
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Income Tax Mode */
        <div className="calc-layout-grid">
          <div className="input-panel">
            <h3>Annual Income Parameters</h3>
            <div className="field-group">
              <label>Gross Annual Salary ({country.currencySymbol})</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={grossIncome}
                onChange={(e) => setGrossIncome(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="results-panel">
            <h3>{country.countryName} Take-Home Pay</h3>
            <div className="metric-highlight">
              <span>Monthly Take-Home Pay</span>
              <strong>
                {country.currencySymbol}
                {incomeTaxCalc.monthlyTakeHome.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </strong>
            </div>

            <div className="breakdown-table">
              <div className="table-row">
                <span>Annual Gross:</span>
                <span>
                  {country.currencySymbol}
                  {grossIncome.toLocaleString("en-US")}
                </span>
              </div>
              <div className="table-row">
                <span>Income Tax:</span>
                <span className="negative-val">
                  -{country.currencySymbol}
                  {incomeTaxCalc.incomeTax.toFixed(0)}
                </span>
              </div>
              <div className="table-row">
                <span>{country.socialSecurityName} ({country.socialSecurityRate}%):</span>
                <span className="negative-val">
                  -{country.currencySymbol}
                  {incomeTaxCalc.socialSecurity.toFixed(0)}
                </span>
              </div>
              <div className="table-row total-row">
                <span>Annual Net Pay:</span>
                <strong>
                  {country.currencySymbol}
                  {incomeTaxCalc.netIncome.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </strong>
              </div>
              <div className="table-row">
                <span>Effective Tax Rate:</span>
                <span>{incomeTaxCalc.effectiveRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="engine-footer-note">
        <ShieldCheck size={16} />
        <span>Calculated client-side with 2026 {country.countryName} official tax thresholds and zero tracking.</span>
      </div>
    </div>
  );
}
