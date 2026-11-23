"use client";

import { useState, useMemo } from "react";
import { US_STATES } from "@/data/programmatic/us-states";
import type { ToolDefinition } from "@/lib/tools-registry";
import { ShieldCheck, MapPin } from "lucide-react";

interface PresetData {
  stateCode?: string;
  stateSlug?: string;
  calcMode?: "paycheck" | "sales-tax" | "overtime" | "hourly" | "1099-tax" | "property-tax" | "capital-gains";
}

// 2026 Federal Brackets (Single)
const FEDERAL_BRACKETS_SINGLE = [
  { threshold: 0, rate: 0.10 },
  { threshold: 11600, rate: 0.12 },
  { threshold: 47150, rate: 0.22 },
  { threshold: 100525, rate: 0.24 },
  { threshold: 191950, rate: 0.32 },
  { threshold: 243725, rate: 0.35 },
  { threshold: 609350, rate: 0.37 },
];

const FEDERAL_STANDARD_DEDUCTION = 14600;

export default function StateTaxPaycheckEngine({ tool }: { tool: ToolDefinition }) {
  const preset = (tool.preset || {}) as PresetData;
  const initialCode = preset.stateCode || "TX";
  const mode = preset.calcMode || "paycheck";

  const [selectedStateCode, setSelectedStateCode] = useState<string>(initialCode);

  const stateData = useMemo(() => {
    return US_STATES.find((s) => s.code === selectedStateCode) || US_STATES[0];
  }, [selectedStateCode]);

  const [grossAnnual, setGrossAnnual] = useState<number>(75000);
  const [hourlyRate, setHourlyRate] = useState<number>(35);
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(40);
  const [payPeriod, setPayPeriod] = useState<"annual" | "monthly" | "biweekly" | "weekly">("biweekly");
  const [filingStatus, setFilingStatus] = useState<"single" | "married">("single");

  // Sales tax mode states
  const [purchaseAmount, setPurchaseAmount] = useState<number>(100);

  // Overtime mode states
  const [overtimeHours, setOvertimeHours] = useState<number>(10);
  const [doubleTimeHours, setDoubleTimeHours] = useState<number>(0);

  // 1099 Self-Employment mode states
  const [businessExpenses, setBusinessExpenses] = useState<number>(12000);

  // Property Tax mode states
  const [propertyValue, setPropertyValue] = useState<number>(stateData.medianHomePrice || 350000);
  const [homesteadExemption, setHomesteadExemption] = useState<number>(25000);
  const [propertyTaxRate, setPropertyTaxRate] = useState<number>(stateData.avgPropertyTaxRate || 1.1);

  // Capital Gains mode states
  const [assetPurchasePrice, setAssetPurchasePrice] = useState<number>(50000);
  const [assetSalePrice, setAssetSalePrice] = useState<number>(85000);
  const [holdingPeriod, setHoldingPeriod] = useState<"long-term" | "short-term">("long-term");
  const [otherIncome, setOtherIncome] = useState<number>(95000);

  // Tax and Paycheck Calculations
  const calculations = useMemo(() => {
    let annualGross = grossAnnual;
    if (mode === "hourly") {
      annualGross = hourlyRate * hoursPerWeek * 52;
    }

    let seTax = 0;
    let netTaxableBase = annualGross;
    if (mode === "1099-tax") {
      const netProfit = Math.max(0, annualGross - businessExpenses);
      const seTaxable = netProfit * 0.9235;
      const ssSe = Math.min(seTaxable, 168600) * 0.124;
      const medSe = seTaxable * 0.029;
      seTax = ssSe + medSe;
      netTaxableBase = Math.max(0, netProfit - seTax * 0.5);
    }

    // Federal Tax Calculation
    const fedTaxable = Math.max(0, netTaxableBase - FEDERAL_STANDARD_DEDUCTION);
    let federalTax = 0;
    for (let i = 0; i < FEDERAL_BRACKETS_SINGLE.length; i++) {
      const current = FEDERAL_BRACKETS_SINGLE[i];
      const next = FEDERAL_BRACKETS_SINGLE[i + 1];
      if (fedTaxable > current.threshold) {
        const taxableInBracket = next ? Math.min(fedTaxable - current.threshold, next.threshold - current.threshold) : fedTaxable - current.threshold;
        federalTax += taxableInBracket * current.rate;
      }
    }

    // FICA / Self-Employment Tax
    const ssTax = mode === "1099-tax" ? Math.min(Math.max(0, annualGross - businessExpenses) * 0.9235, 168600) * 0.124 : Math.min(annualGross, 168600) * 0.062;
    const medicareTax = mode === "1099-tax" ? Math.max(0, annualGross - businessExpenses) * 0.9235 * 0.029 : annualGross * 0.0145;
    const ficaTotal = mode === "1099-tax" ? seTax : ssTax + medicareTax;

    // State Tax
    let stateTax = 0;
    const stateTaxableIncome = mode === "1099-tax" ? netTaxableBase : annualGross;
    if (stateData.hasIncomeTax) {
      if (stateData.incomeTaxType === "flat" && stateData.flatRate) {
        const stateTaxable = Math.max(0, stateTaxableIncome - stateData.standardDeductionSingle);
        stateTax = stateTaxable * (stateData.flatRate / 100);
      } else if (stateData.brackets && stateData.brackets.length > 0) {
        const stateTaxable = Math.max(0, stateTaxableIncome - stateData.standardDeductionSingle);
        for (let i = 0; i < stateData.brackets.length; i++) {
          const b = stateData.brackets[i];
          const next = stateData.brackets[i + 1];
          if (stateTaxable > b.threshold) {
            const chunk = next ? Math.min(stateTaxable - b.threshold, next.threshold - b.threshold) : stateTaxable - b.threshold;
            stateTax += chunk * b.rate;
          }
        }
      } else {
        stateTax = Math.max(0, stateTaxableIncome - stateData.standardDeductionSingle) * (stateData.topMarginalRate / 100);
      }
    }

    const totalTaxes = federalTax + ficaTotal + stateTax;
    const effectiveBase = mode === "1099-tax" ? Math.max(1, annualGross - businessExpenses) : Math.max(1, annualGross);
    const netAnnual = Math.max(0, (mode === "1099-tax" ? annualGross - businessExpenses : annualGross) - totalTaxes);
    const effectiveRate = (totalTaxes / effectiveBase) * 100;

    const periodsCount = {
      annual: 1,
      monthly: 12,
      biweekly: 26,
      weekly: 52,
    }[payPeriod];

    return {
      annualGross,
      businessExpenses,
      netProfit: mode === "1099-tax" ? Math.max(0, annualGross - businessExpenses) : annualGross,
      seTax,
      federalTax,
      ssTax,
      medicareTax,
      ficaTotal,
      stateTax,
      totalTaxes,
      netAnnual,
      takeHomePayPerPeriod: netAnnual / periodsCount,
      grossPayPerPeriod: (mode === "1099-tax" ? Math.max(0, annualGross - businessExpenses) : annualGross) / periodsCount,
      effectiveRate,
    };
  }, [grossAnnual, businessExpenses, hourlyRate, hoursPerWeek, payPeriod, mode, stateData]);

  // Sales Tax Mode calculation
  const salesTaxCalc = useMemo(() => {
    const stateTax = purchaseAmount * (stateData.stateSalesTax / 100);
    const avgTotalTax = purchaseAmount * (stateData.avgSalesTax / 100);
    const localTax = Math.max(0, avgTotalTax - stateTax);
    const totalCost = purchaseAmount + avgTotalTax;
    return { stateTax, localTax, avgTotalTax, totalCost };
  }, [purchaseAmount, stateData]);

  // Overtime Mode calculation
  const overtimeCalc = useMemo(() => {
    const regularPay = hourlyRate * Math.min(40, hoursPerWeek);
    const overtimePay = hourlyRate * 1.5 * overtimeHours;
    const doubleTimePay = hourlyRate * 2.0 * doubleTimeHours;
    const totalWeeklyGross = regularPay + overtimePay + doubleTimePay;
    return { regularPay, overtimePay, doubleTimePay, totalWeeklyGross };
  }, [hourlyRate, hoursPerWeek, overtimeHours, doubleTimeHours]);

  // Property Tax Mode calculation
  const propertyTaxCalc = useMemo(() => {
    const taxableValue = Math.max(0, propertyValue - homesteadExemption);
    const annualTax = taxableValue * (propertyTaxRate / 100);
    const monthlyEscrow = annualTax / 12;
    const effectiveRate = propertyValue > 0 ? (annualTax / propertyValue) * 100 : 0;
    return { taxableValue, annualTax, monthlyEscrow, effectiveRate };
  }, [propertyValue, homesteadExemption, propertyTaxRate]);

  // Capital Gains Mode calculation
  const capitalGainsCalc = useMemo(() => {
    const capitalGain = Math.max(0, assetSalePrice - assetPurchasePrice);
    let federalRate = 0;
    if (holdingPeriod === "long-term") {
      if (otherIncome + capitalGain <= 47025) federalRate = 0;
      else if (otherIncome + capitalGain <= 518900) federalRate = 0.15;
      else federalRate = 0.20;
    } else {
      federalRate = 0.24;
    }
    const niitTax = (otherIncome + capitalGain > 200000 && capitalGain > 0) ? capitalGain * 0.038 : 0;
    const fedGainsTax = capitalGain * federalRate + niitTax;

    let stateGainsRate = 0;
    if (stateData.hasIncomeTax) {
      stateGainsRate = (stateData.topMarginalRate || 5.0) / 100;
    }
    const stateGainsTax = capitalGain * stateGainsRate;
    const totalGainsTax = fedGainsTax + stateGainsTax;
    const netGainsProceeds = capitalGain - totalGainsTax;
    const totalCashOut = assetSalePrice - totalGainsTax;
    const effectiveGainsRate = capitalGain > 0 ? (totalGainsTax / capitalGain) * 100 : 0;

    return { capitalGain, fedGainsTax, stateGainsTax, totalGainsTax, netGainsProceeds, totalCashOut, effectiveGainsRate, federalRate: federalRate * 100, stateGainsRate: stateGainsRate * 100 };
  }, [assetPurchasePrice, assetSalePrice, holdingPeriod, otherIncome, stateData]);

  return (
    <div className="state-tax-engine">
      {/* State Switcher & Overview Header */}
      <div className="engine-card">
        <div className="card-row-between">
          <div className="state-badge-row">
            <span className="state-flag-pill">
              <MapPin size={15} /> {stateData.name} ({stateData.code})
            </span>
            <span className="income-tax-status">
              {stateData.hasIncomeTax ? (
                <>State Tax: {stateData.incomeTaxType === "flat" ? `${stateData.flatRate}% Flat` : `Up to ${stateData.topMarginalRate}%`}</>
              ) : (
                <strong style={{ color: "#16a34a" }}>0% State Income Tax (No Tax)</strong>
              )}
            </span>
          </div>

          <label className="state-select-label">
            Change State:
            <select
              value={selectedStateCode}
              onChange={(e) => setSelectedStateCode(e.target.value)}
              className="state-select"
            >
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name} ({s.code}) - {s.hasIncomeTax ? `${s.topMarginalRate}%` : "0% tax"}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Main Workspace based on mode */}
      {mode === "sales-tax" ? (
        <div className="calc-layout-grid">
          <div className="input-panel">
            <h3>Sales Tax Inputs</h3>
            <div className="field-group">
              <label>Purchase Amount ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(Number(e.target.value) || 0)}
              />
            </div>
            <div className="field-group">
              <label>State Sales Tax Rate: {stateData.stateSalesTax}%</label>
              <p className="field-hint">Average combined local + county rate: {stateData.avgSalesTax}%</p>
            </div>
          </div>

          <div className="results-panel">
            <h3>{stateData.name} Sales Tax Breakdown</h3>
            <div className="metric-highlight">
              <span>Total Price to Pay</span>
              <strong>${salesTaxCalc.totalCost.toFixed(2)}</strong>
            </div>
            <div className="breakdown-table">
              <div className="table-row">
                <span>Subtotal (Pre-Tax):</span>
                <span>${purchaseAmount.toFixed(2)}</span>
              </div>
              <div className="table-row">
                <span>State Tax ({stateData.stateSalesTax}%):</span>
                <span>+${salesTaxCalc.stateTax.toFixed(2)}</span>
              </div>
              <div className="table-row">
                <span>Estimated Local/City Tax:</span>
                <span>+${salesTaxCalc.localTax.toFixed(2)}</span>
              </div>
              <div className="table-row total-row">
                <span>Total Tax Amount ({stateData.avgSalesTax}%):</span>
                <span>${salesTaxCalc.avgTotalTax.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : mode === "overtime" ? (
        <div className="calc-layout-grid">
          <div className="input-panel">
            <h3>Overtime Pay Parameters</h3>
            <div className="field-group">
              <label>Regular Hourly Wage ($/hr)</label>
              <input
                type="number"
                min="0"
                step="0.25"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value) || 0)}
              />
            </div>
            <div className="field-group">
              <label>Regular Hours Worked (max 40)</label>
              <input
                type="number"
                min="0"
                max="40"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(Number(e.target.value) || 0)}
              />
            </div>
            <div className="field-group">
              <label>Overtime Hours (1.5x Rate)</label>
              <input
                type="number"
                min="0"
                value={overtimeHours}
                onChange={(e) => setOvertimeHours(Number(e.target.value) || 0)}
              />
            </div>
            <div className="field-group">
              <label>Double Time Hours (2.0x Rate)</label>
              <input
                type="number"
                min="0"
                value={doubleTimeHours}
                onChange={(e) => setDoubleTimeHours(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="results-panel">
            <h3>{stateData.name} Weekly Overtime Summary</h3>
            <div className="metric-highlight">
              <span>Total Weekly Gross</span>
              <strong>${overtimeCalc.totalWeeklyGross.toFixed(2)}</strong>
            </div>
            <div className="breakdown-table">
              <div className="table-row">
                <span>Regular Pay (at ${hourlyRate}/hr):</span>
                <span>${overtimeCalc.regularPay.toFixed(2)}</span>
              </div>
              <div className="table-row">
                <span>Overtime Pay (at ${(hourlyRate * 1.5).toFixed(2)}/hr):</span>
                <span>+${overtimeCalc.overtimePay.toFixed(2)}</span>
              </div>
              {doubleTimeHours > 0 && (
                <div className="table-row">
                  <span>Double Time Pay (at ${(hourlyRate * 2.0).toFixed(2)}/hr):</span>
                  <span>+${overtimeCalc.doubleTimePay.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : mode === "property-tax" ? (
        <div className="calc-layout-grid">
          <div className="input-panel">
            <h3>{stateData.name} Property Tax Parameters</h3>
            <div className="field-group">
              <label>Home Assessed Value ($)</label>
              <input
                type="number"
                min="0"
                step="5000"
                value={propertyValue}
                onChange={(e) => setPropertyValue(Number(e.target.value) || 0)}
              />
              <p className="field-hint">Median state home value: ${stateData.medianHomePrice.toLocaleString()}</p>
            </div>
            <div className="field-group">
              <label>Homestead Exemption ($)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={homesteadExemption}
                onChange={(e) => setHomesteadExemption(Number(e.target.value) || 0)}
              />
              <p className="field-hint">Primary residence tax relief deduction</p>
            </div>
            <div className="field-group">
              <label>Effective Property Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={propertyTaxRate}
                onChange={(e) => setPropertyTaxRate(Number(e.target.value) || 0)}
              />
              <p className="field-hint">{stateData.name} state average: {stateData.avgPropertyTaxRate}%</p>
            </div>
          </div>

          <div className="results-panel">
            <h3>{stateData.name} Property Tax Estimate</h3>
            <div className="metric-highlight">
              <span>Annual Property Tax Due</span>
              <strong>${propertyTaxCalc.annualTax.toLocaleString("en-US", { maximumFractionDigits: 0 })}</strong>
            </div>
            <div className="breakdown-table">
              <div className="table-row">
                <span>Monthly Escrow Payment:</span>
                <strong>${propertyTaxCalc.monthlyEscrow.toFixed(2)}/mo</strong>
              </div>
              <div className="table-row">
                <span>Gross Assessed Value:</span>
                <span>${propertyValue.toLocaleString()}</span>
              </div>
              <div className="table-row">
                <span>Homestead Exemption:</span>
                <span className="negative-val">-${homesteadExemption.toLocaleString()}</span>
              </div>
              <div className="table-row">
                <span>Net Taxable Assessed Value:</span>
                <span>${propertyTaxCalc.taxableValue.toLocaleString()}</span>
              </div>
              <div className="table-row total-row">
                <span>Effective Tax Rate:</span>
                <span>{propertyTaxCalc.effectiveRate.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>
      ) : mode === "capital-gains" ? (
        <div className="calc-layout-grid">
          <div className="input-panel">
            <h3>Capital Gains Parameters</h3>
            <div className="field-group">
              <label>Original Purchase Cost ($)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={assetPurchasePrice}
                onChange={(e) => setAssetPurchasePrice(Number(e.target.value) || 0)}
              />
            </div>
            <div className="field-group">
              <label>Total Sale Price ($)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={assetSalePrice}
                onChange={(e) => setAssetSalePrice(Number(e.target.value) || 0)}
              />
            </div>
            <div className="field-group">
              <label>Holding Period</label>
              <div className="radio-pill-group">
                <button
                  type="button"
                  className={holdingPeriod === "long-term" ? "pill-active" : "pill-btn"}
                  onClick={() => setHoldingPeriod("long-term")}
                >
                  Long-Term (&gt; 1 Year)
                </button>
                <button
                  type="button"
                  className={holdingPeriod === "short-term" ? "pill-active" : "pill-btn"}
                  onClick={() => setHoldingPeriod("short-term")}
                >
                  Short-Term (&le; 1 Year)
                </button>
              </div>
            </div>
            <div className="field-group">
              <label>Other Annual Taxable Income ($)</label>
              <input
                type="number"
                min="0"
                step="5000"
                value={otherIncome}
                onChange={(e) => setOtherIncome(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="results-panel">
            <h3>{stateData.name} Capital Gains Breakdown</h3>
            <div className="metric-highlight">
              <span>Net After-Tax Profit</span>
              <strong>${capitalGainsCalc.netGainsProceeds.toLocaleString("en-US", { maximumFractionDigits: 0 })}</strong>
            </div>
            <div className="breakdown-table">
              <div className="table-row">
                <span>Gross Capital Gain:</span>
                <span>${capitalGainsCalc.capitalGain.toLocaleString()}</span>
              </div>
              <div className="table-row">
                <span>Federal Tax ({capitalGainsCalc.federalRate.toFixed(1)}%):</span>
                <span className="negative-val">-${capitalGainsCalc.fedGainsTax.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="table-row">
                <span>{stateData.name} State Tax ({capitalGainsCalc.stateGainsRate.toFixed(1)}%):</span>
                <span className={stateData.hasIncomeTax ? "negative-val" : "green-val"}>
                  {stateData.hasIncomeTax ? `-$${capitalGainsCalc.stateGainsTax.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "$0 (0% State Capital Gains)"}
                </span>
              </div>
              <div className="table-row total-row">
                <span>Total Tax Due:</span>
                <span>${capitalGainsCalc.totalGainsTax.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="table-row">
                <span>Total Cash Returned:</span>
                <strong>${capitalGainsCalc.totalCashOut.toLocaleString("en-US", { maximumFractionDigits: 0 })}</strong>
              </div>
              <div className="table-row">
                <span>Effective Tax on Profit:</span>
                <span>{capitalGainsCalc.effectiveGainsRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Standard Paycheck & Income Tax Mode */
        <div className="calc-layout-grid">
          <div className="input-panel">
            <h3>Paycheck Settings</h3>
            {mode === "hourly" ? (
              <>
                <div className="field-group">
                  <label>Hourly Wage ($/hour)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="field-group">
                  <label>Hours per Week</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(Number(e.target.value) || 0)}
                  />
                </div>
              </>
            ) : mode === "1099-tax" ? (
              <>
                <div className="field-group">
                  <label>1099 Gross Business Revenue ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={grossAnnual}
                    onChange={(e) => setGrossAnnual(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="field-group">
                  <label>Annual Business Expenses & Deductions ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={businessExpenses}
                    onChange={(e) => setBusinessExpenses(Number(e.target.value) || 0)}
                  />
                </div>
              </>
            ) : (
              <div className="field-group">
                <label>Annual Gross Salary ($)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={grossAnnual}
                  onChange={(e) => setGrossAnnual(Number(e.target.value) || 0)}
                />
              </div>
            )}

            <div className="field-group">
              <label>Pay Frequency</label>
              <select
                value={payPeriod}
                onChange={(e) => setPayPeriod(e.target.value as "annual" | "monthly" | "biweekly" | "weekly")}
              >
                <option value="annual">Annually (1 / year)</option>
                <option value="monthly">Monthly (12 / year)</option>
                <option value="biweekly">Bi-Weekly (26 / year)</option>
                <option value="weekly">Weekly (52 / year)</option>
              </select>
            </div>

            <div className="field-group">
              <label>Filing Status</label>
              <select
                value={filingStatus}
                onChange={(e) => setFilingStatus(e.target.value as "single" | "married")}
              >
                <option value="single">Single</option>
                <option value="married">Married Filing Jointly</option>
              </select>
            </div>
          </div>

          <div className="results-panel">
            <h3>{mode === "1099-tax" ? `${stateData.name} 1099 Tax & Net Profit` : `${stateData.name} Take-Home Paycheck`}</h3>
            <div className="metric-highlight">
              <span>{mode === "1099-tax" ? "Net Take-Home Earnings" : `Take-Home Pay (${payPeriod})`}</span>
              <strong>${(mode === "1099-tax" ? calculations.netAnnual : calculations.takeHomePayPerPeriod).toLocaleString("en-US", { maximumFractionDigits: 0 })}</strong>
            </div>

            <div className="breakdown-table">
              <div className="table-row">
                <span>{mode === "1099-tax" ? "1099 Gross Business Revenue:" : `Gross Pay (${payPeriod}):`}</span>
                <span>${(mode === "1099-tax" ? calculations.annualGross : calculations.grossPayPerPeriod).toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
              </div>
              {mode === "1099-tax" && (
                <div className="table-row">
                  <span>Business Deductions & Expenses:</span>
                  <span className="negative-val">-${calculations.businessExpenses.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                </div>
              )}
              {mode === "1099-tax" && (
                <div className="table-row">
                  <span>Taxable Net Business Profit:</span>
                  <span>${calculations.netProfit.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                </div>
              )}
              <div className="table-row">
                <span>Federal Income Tax:</span>
                <span className="negative-val">-${(calculations.federalTax / (mode === "1099-tax" ? 1 : payPeriod === "annual" ? 1 : payPeriod === "monthly" ? 12 : payPeriod === "biweekly" ? 26 : 52)).toFixed(0)}</span>
              </div>
              <div className="table-row">
                <span>{mode === "1099-tax" ? "Self-Employment Tax (15.3% SECA):" : "FICA Payroll Tax (7.65%):"}</span>
                <span className="negative-val">-${(calculations.ficaTotal / (mode === "1099-tax" ? 1 : payPeriod === "annual" ? 1 : payPeriod === "monthly" ? 12 : payPeriod === "biweekly" ? 26 : 52)).toFixed(0)}</span>
              </div>
              <div className="table-row">
                <span>{stateData.name} State Tax:</span>
                <span className={stateData.hasIncomeTax ? "negative-val" : "green-val"}>
                  {stateData.hasIncomeTax ? `-$${(calculations.stateTax / (mode === "1099-tax" ? 1 : payPeriod === "annual" ? 1 : payPeriod === "monthly" ? 12 : payPeriod === "biweekly" ? 26 : 52)).toFixed(0)}` : "$0 (No state tax)"}
                </span>
              </div>
              <div className="table-row total-row">
                <span>Total Annual Net Take-Home:</span>
                <strong>${calculations.netAnnual.toLocaleString("en-US", { maximumFractionDigits: 0 })}</strong>
              </div>
              <div className="table-row">
                <span>Effective Total Tax Rate:</span>
                <span>{calculations.effectiveRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trust & Privacy Notice */}
      <div className="engine-footer-note">
        <ShieldCheck size={16} />
        <span>Calculated 100% locally in your browser based on 2026 IRS federal brackets and {stateData.name} statutory tax schedules. Zero data sent to any server.</span>
      </div>
    </div>
  );
}
