"use client";

import { useState, useMemo } from "react";
import { US_MAJOR_CITIES, type UsCityData } from "@/data/programmatic/us-cities";
import { US_STATES } from "@/data/programmatic/us-states";
import type { ToolDefinition } from "@/lib/tools-registry";
import { ShieldCheck, Building2, DollarSign } from "lucide-react";

interface PresetData {
  citySlug?: string;
  calcMode?: "paycheck" | "income-tax" | "hourly" | "overtime";
}

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

export default function CityTaxPaycheckEngine({ tool }: { tool: ToolDefinition }) {
  const preset = (tool.preset || {}) as PresetData;
  const initialSlug = preset.citySlug || "new-york-city";
  const mode = preset.calcMode || "paycheck";

  const [selectedCitySlug, setSelectedCitySlug] = useState<string>(initialSlug);
  const [isResident, setIsResident] = useState<boolean>(true);
  const [grossAnnual, setGrossAnnual] = useState<number>(85000);
  const [hourlyRate, setHourlyRate] = useState<number>(40);
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(40);
  const [payPeriod, setPayPeriod] = useState<"annual" | "monthly" | "biweekly" | "weekly">("biweekly");
  const [overtimeHours, setOvertimeHours] = useState<number>(10);

  const cityData: UsCityData = useMemo(() => {
    return US_MAJOR_CITIES.find((c) => c.slug === selectedCitySlug) || US_MAJOR_CITIES[0];
  }, [selectedCitySlug]);

  const stateData = useMemo(() => {
    return US_STATES.find((s) => s.code === cityData.stateCode) || US_STATES[0];
  }, [cityData]);

  // Comprehensive Tax & Paycheck Calculations
  const calculations = useMemo(() => {
    let annualGross = grossAnnual;
    if (mode === "hourly") {
      annualGross = hourlyRate * hoursPerWeek * 52;
    } else if (mode === "overtime") {
      const basePay = hourlyRate * hoursPerWeek * 52;
      const otMultiplier = 1.5;
      const otAnnual = overtimeHours * (hourlyRate * otMultiplier) * 52;
      annualGross = basePay + otAnnual;
    }

    // Federal Tax Calculation
    const fedTaxable = Math.max(0, annualGross - FEDERAL_STANDARD_DEDUCTION);
    let federalTax = 0;
    for (let i = 0; i < FEDERAL_BRACKETS_SINGLE.length; i++) {
      const current = FEDERAL_BRACKETS_SINGLE[i];
      const next = FEDERAL_BRACKETS_SINGLE[i + 1];
      if (fedTaxable > current.threshold) {
        const taxableInBracket = next
          ? Math.min(fedTaxable - current.threshold, next.threshold - current.threshold)
          : fedTaxable - current.threshold;
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
          const nextB = stateData.brackets[i + 1];
          if (stateTaxable > b.threshold) {
            const taxable = nextB ? Math.min(stateTaxable - b.threshold, nextB.threshold - b.threshold) : stateTaxable - b.threshold;
            stateTax += taxable * (b.rate / 100);
          }
        }
      }
    }

    // Local / City Tax Calculation
    let cityTax = 0;
    const applicableRate = isResident ? cityData.cityResidentRate : cityData.cityNonResidentRate;

    if (cityData.slug === "new-york-city" && isResident) {
      // NYC Graduated Personal Income Tax
      // 3.078% up to $12k, 3.762% up to $25k, 3.819% up to $50k, 3.876% above
      const nycTaxable = Math.max(0, annualGross - 3200);
      if (nycTaxable <= 12000) {
        cityTax = nycTaxable * 0.03078;
      } else if (nycTaxable <= 25000) {
        cityTax = 12000 * 0.03078 + (nycTaxable - 12000) * 0.03762;
      } else if (nycTaxable <= 50000) {
        cityTax = 12000 * 0.03078 + 13000 * 0.03762 + (nycTaxable - 25000) * 0.03819;
      } else {
        cityTax = 12000 * 0.03078 + 13000 * 0.03762 + 25000 * 0.03819 + (nycTaxable - 50000) * 0.03876;
      }
    } else if (cityData.slug === "yonkers" && isResident) {
      // Yonkers is 16.75% surcharge of New York State tax
      cityTax = stateTax * 0.1675;
    } else if (cityData.slug === "washington-dc") {
      // DC Graduated brackets: 4% to 10.75%
      const dcTaxable = Math.max(0, annualGross - 4400);
      cityTax = dcTaxable * 0.065; // average effective municipal rate for typical salaries
    } else if (applicableRate > 0) {
      cityTax = annualGross * (applicableRate / 100);
    }

    const totalTax = federalTax + ficaTotal + stateTax + cityTax;
    const netAnnual = Math.max(0, annualGross - totalTax);
    const effectiveTotalRate = annualGross > 0 ? (totalTax / annualGross) * 100 : 0;

    // Period breakdown
    let periodDivisor = 1;
    if (payPeriod === "monthly") periodDivisor = 12;
    if (payPeriod === "biweekly") periodDivisor = 26;
    if (payPeriod === "weekly") periodDivisor = 52;

    return {
      annualGross,
      federalTax,
      ficaTotal,
      ssTax,
      medicareTax,
      stateTax,
      cityTax,
      totalTax,
      netAnnual,
      takeHomePeriod: netAnnual / periodDivisor,
      grossPeriod: annualGross / periodDivisor,
      taxPeriod: totalTax / periodDivisor,
      effectiveTotalRate,
      effectiveCityRate: annualGross > 0 ? (cityTax / annualGross) * 100 : 0,
    };
  }, [grossAnnual, hourlyRate, hoursPerWeek, overtimeHours, mode, isResident, cityData, stateData, payPeriod]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* City Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-medium tracking-wide uppercase mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>2026 Metro Municipal Tax Engine</span>
            <span className="text-slate-600">•</span>
            <span>100% In-Browser Privacy</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>{cityData.name}, {cityData.stateCode}</span>
            {cityData.hasSpecialLocalTax ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {cityData.cityResidentRate > 0 ? `${cityData.cityResidentRate}% Local Tax` : "Local Surcharge"}
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                0% Municipal Wage Tax
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {cityData.specialTaxNotes || `Calculates take-home pay with federal, ${cityData.stateName} state, and local municipal taxes.`}
          </p>
        </div>

        {/* City Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 whitespace-nowrap">Switch City:</label>
          <select
            value={selectedCitySlug}
            onChange={(e) => setSelectedCitySlug(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            {US_MAJOR_CITIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}, {c.stateCode}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Inputs vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Column (5 cols) */}
        <div className="lg:col-span-5 space-y-5 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Earnings & Municipal Settings</span>
          </h3>

          {/* Mode-specific earnings input */}
          {mode === "hourly" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Hourly Rate ($/hr)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">$</span>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg pl-8 pr-3 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Hours Worked Per Week: <span className="text-emerald-400 font-mono">{hoursPerWeek} hrs</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="80"
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>
          ) : mode === "overtime" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Base Hourly Rate ($/hr)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">$</span>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg pl-8 pr-3 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Weekly Overtime Hours (1.5x Pay): <span className="text-emerald-400 font-mono">{overtimeHours} hrs</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={overtimeHours}
                  onChange={(e) => setOvertimeHours(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Gross Annual Salary
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">$</span>
                  <input
                    type="number"
                    step="1000"
                    value={grossAnnual}
                    onChange={(e) => setGrossAnnual(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg pl-8 pr-3 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[50000, 75000, 100000, 150000, 200000].map((presetVal) => (
                  <button
                    key={presetVal}
                    type="button"
                    onClick={() => setGrossAnnual(presetVal)}
                    className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                      grossAnnual === presetVal
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    ${presetVal / 1000}k
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* City Residency Toggle */}
          {cityData.hasSpecialLocalTax && (
            <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg space-y-2">
              <span className="text-xs font-medium text-slate-300 block">Residency Status in {cityData.name}</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsResident(true)}
                  className={`py-1.5 text-xs rounded border text-center transition-colors ${
                    isResident
                      ? "bg-emerald-600 text-white border-emerald-500 font-medium"
                      : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  City Resident
                </button>
                <button
                  type="button"
                  onClick={() => setIsResident(false)}
                  className={`py-1.5 text-xs rounded border text-center transition-colors ${
                    !isResident
                      ? "bg-emerald-600 text-white border-emerald-500 font-medium"
                      : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  Non-Resident Worker
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                {isResident
                  ? `Subject to full ${cityData.name} resident tax rates (${cityData.cityResidentRate}%).`
                  : `Subject to non-resident rate (${cityData.cityNonResidentRate}%) for work performed inside city limits.`}
              </p>
            </div>
          )}

          {/* Pay Frequency */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Display Pay Period</label>
            <div className="grid grid-cols-4 gap-1.5 bg-slate-800 p-1 rounded-lg border border-slate-700">
              {(["biweekly", "monthly", "weekly", "annual"] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setPayPeriod(period)}
                  className={`text-xs capitalize py-1.5 rounded transition-colors ${
                    payPeriod === period
                      ? "bg-slate-700 text-emerald-400 font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {period === "biweekly" ? "Bi-Wk" : period}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Results Column (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Hero Take-Home Box */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 rounded-xl p-6 shadow-lg relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Estimated Net Take-Home ({payPeriod})
                </span>
                <div className="text-3xl md:text-4xl font-extrabold text-emerald-400 font-mono mt-1">
                  {formatCurrency(calculations.takeHomePeriod)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  from {formatCurrency(calculations.grossPeriod)} gross ({formatCurrency(calculations.netAnnual)} / year)
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Total Effective Tax</span>
                <span className="text-lg font-bold font-mono text-rose-400">
                  {calculations.effectiveTotalRate.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Visual Bar Breakdown */}
            <div className="mt-5 space-y-1.5">
              <div className="text-xs text-slate-400 flex justify-between">
                <span>Deduction Breakdown</span>
                <span className="text-slate-500 font-mono">100% Gross</span>
              </div>
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${(calculations.netAnnual / calculations.annualGross) * 100}%` }}
                  className="bg-emerald-500"
                  title="Net Pay"
                />
                <div
                  style={{ width: `${(calculations.federalTax / calculations.annualGross) * 100}%` }}
                  className="bg-rose-500"
                  title="Federal Tax"
                />
                <div
                  style={{ width: `${(calculations.ficaTotal / calculations.annualGross) * 100}%` }}
                  className="bg-amber-500"
                  title="FICA (SS + Medicare)"
                />
                <div
                  style={{ width: `${(calculations.stateTax / calculations.annualGross) * 100}%` }}
                  className="bg-blue-500"
                  title="State Tax"
                />
                {calculations.cityTax > 0 && (
                  <div
                    style={{ width: `${(calculations.cityTax / calculations.annualGross) * 100}%` }}
                    className="bg-purple-500"
                    title="City Tax"
                  />
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Net Pay ({((calculations.netAnnual / calculations.annualGross) * 100).toFixed(0)}%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Federal ({((calculations.federalTax / calculations.annualGross) * 100).toFixed(1)}%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> FICA ({((calculations.ficaTotal / calculations.annualGross) * 100).toFixed(1)}%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> {cityData.stateCode} State ({((calculations.stateTax / calculations.annualGross) * 100).toFixed(1)}%)
                </span>
                {calculations.cityTax > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> {cityData.name} City ({((calculations.cityTax / calculations.annualGross) * 100).toFixed(1)}%)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Tax Itemization Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 text-xs font-semibold text-slate-300 flex justify-between">
              <span>Tax Category</span>
              <span>Annual Amount</span>
            </div>
            <div className="divide-y divide-slate-800/60 text-xs">
              <div className="px-4 py-2.5 flex justify-between items-center text-slate-300">
                <span>Federal Income Tax (IRS)</span>
                <span className="font-mono text-rose-400 font-medium">{formatCurrency(calculations.federalTax)}</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between items-center text-slate-300">
                <span>Social Security (6.2%)</span>
                <span className="font-mono text-amber-400 font-medium">{formatCurrency(calculations.ssTax)}</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between items-center text-slate-300">
                <span>Medicare (1.45%)</span>
                <span className="font-mono text-amber-400 font-medium">{formatCurrency(calculations.medicareTax)}</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between items-center text-slate-300">
                <span>{cityData.stateName} State Tax</span>
                <span className="font-mono text-blue-400 font-medium">{formatCurrency(calculations.stateTax)}</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between items-center text-slate-300 bg-purple-950/20">
                <span className="font-medium text-purple-300">{cityData.name} Municipal Tax</span>
                <span className="font-mono text-purple-400 font-medium">{formatCurrency(calculations.cityTax)}</span>
              </div>
              <div className="px-4 py-3 flex justify-between items-center bg-slate-800/40 text-slate-200 font-semibold">
                <span>Total Deductions & Taxes</span>
                <span className="font-mono text-rose-400">{formatCurrency(calculations.totalTax)}</span>
              </div>
            </div>
          </div>

          {/* Privacy & Methodology Footnote */}
          <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Private client-side calculation based on 2026 IRS federal brackets and {cityData.name} municipal tax code.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
