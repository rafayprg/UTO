"use client";

import { useState, useMemo } from "react";
import { US_STATES } from "@/data/programmatic/us-states";
import type { ToolDefinition } from "@/lib/tools-registry";
import { ShieldCheck, MapPin } from "lucide-react";

interface PresetData {
  stateCode?: string;
  stateSlug?: string;
  calcMode?: "paycheck" | "sales-tax" | "overtime" | "hourly";
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

  const stateData = useMemo(() => {
    return US_STATES.find((s) => s.code === selectedStateCode) || US_STATES[0];
  }, [selectedStateCode]);

  // Tax and Paycheck Calculations
  const calculations = useMemo(() => {
    let annualGross = grossAnnual;
    if (mode === "hourly") {
      annualGross = hourlyRate * hoursPerWeek * 52;
    }

    // Federal Tax Calculation
    const fedTaxable = Math.max(0, annualGross - FEDERAL_STANDARD_DEDUCTION);
    let federalTax = 0;
    for (let i = 0; i < FEDERAL_BRACKETS_SINGLE.length; i++) {
      const current = FEDERAL_BRACKETS_SINGLE[i];
      const next = FEDERAL_BRACKETS_SINGLE[i + 1];
      if (fedTaxable > current.threshold) {
        const taxableInBracket = next ? Math.min(fedTaxable - current.threshold, next.threshold - current.threshold) : fedTaxable - current.threshold;
        federalTax += taxableInBracket * current.rate;
      }
    }

    // FICA
    const ssTax = Math.min(annualGross, 168600) * 0.062;
    const medicareTax = annualGross * 0.0145;
    const ficaTotal = ssTax + medicareTax;

    // State Tax
    let stateTax = 0;
    if (stateData.hasIncomeTax) {
      if (stateData.incomeTaxType === "flat" && stateData.flatRate) {
        const stateTaxable = Math.max(0, annualGross - stateData.standardDeductionSingle);
        stateTax = stateTaxable * (stateData.flatRate / 100);
      } else if (stateData.brackets && stateData.brackets.length > 0) {
        const stateTaxable = Math.max(0, annualGross - stateData.standardDeductionSingle);
        for (let i = 0; i < stateData.brackets.length; i++) {
          const b = stateData.brackets[i];
          const next = stateData.brackets[i + 1];
          if (stateTaxable > b.threshold) {
            const chunk = next ? Math.min(stateTaxable - b.threshold, next.threshold - b.threshold) : stateTaxable - b.threshold;
            stateTax += chunk * b.rate;
          }
        }
      } else {
        stateTax = Math.max(0, annualGross - stateData.standardDeductionSingle) * (stateData.topMarginalRate / 100);
      }
    }

    const totalTaxes = federalTax + ficaTotal + stateTax;
    const netAnnual = Math.max(0, annualGross - totalTaxes);
    const effectiveRate = annualGross > 0 ? (totalTaxes / annualGross) * 100 : 0;

    const periodsCount = {
      annual: 1,
      monthly: 12,
      biweekly: 26,
      weekly: 52,
    }[payPeriod];

    return {
      annualGross,
      federalTax,
      ssTax,
      medicareTax,
      ficaTotal,
      stateTax,
      totalTaxes,
      netAnnual,
      takeHomePayPerPeriod: netAnnual / periodsCount,
      grossPayPerPeriod: annualGross / periodsCount,
      effectiveRate,
    };
  }, [grossAnnual, hourlyRate, hoursPerWeek, payPeriod, mode, stateData]);

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
            <h3>{stateData.name} Take-Home Paycheck</h3>
            <div className="metric-highlight">
              <span>Take-Home Pay ({payPeriod})</span>
              <strong>${calculations.takeHomePayPerPeriod.toLocaleString("en-US", { maximumFractionDigits: 0 })}</strong>
            </div>

            <div className="breakdown-table">
              <div className="table-row">
                <span>Gross Pay ({payPeriod}):</span>
                <span>${calculations.grossPayPerPeriod.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="table-row">
                <span>Federal Income Tax:</span>
                <span className="negative-val">-${(calculations.federalTax / (payPeriod === "annual" ? 1 : payPeriod === "monthly" ? 12 : payPeriod === "biweekly" ? 26 : 52)).toFixed(0)}</span>
              </div>
              <div className="table-row">
                <span>Social Security (6.2%):</span>
                <span className="negative-val">-${(calculations.ssTax / (payPeriod === "annual" ? 1 : payPeriod === "monthly" ? 12 : payPeriod === "biweekly" ? 26 : 52)).toFixed(0)}</span>
              </div>
              <div className="table-row">
                <span>Medicare (1.45%):</span>
                <span className="negative-val">-${(calculations.medicareTax / (payPeriod === "annual" ? 1 : payPeriod === "monthly" ? 12 : payPeriod === "biweekly" ? 26 : 52)).toFixed(0)}</span>
              </div>
              <div className="table-row">
                <span>{stateData.name} State Tax:</span>
                <span className={stateData.hasIncomeTax ? "negative-val" : "green-val"}>
                  {stateData.hasIncomeTax ? `-$${(calculations.stateTax / (payPeriod === "annual" ? 1 : payPeriod === "monthly" ? 12 : payPeriod === "biweekly" ? 26 : 52)).toFixed(0)}` : "$0 (No state tax)"}
                </span>
              </div>
              <div className="table-row total-row">
                <span>Total Annual Take-Home:</span>
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
