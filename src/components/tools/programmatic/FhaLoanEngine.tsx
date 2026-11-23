"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  RotateCcw,
  Copy,
  Check,
  Printer,
  BookOpen,
  ArrowRight,
  Building,
  Home,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import type { ToolDefinition } from "@/lib/tools-registry";

interface FhaLoanEngineProps {
  tool: ToolDefinition;
}

export default function FhaLoanEngine({ tool }: FhaLoanEngineProps) {
  const [homePrice, setHomePrice] = useState<number>(350000);
  const [downPercent, setDownPercent] = useState<number>(3.5);
  const [interestRate, setInterestRate] = useState<number>(6.5);
  const [loanTermYears, setLoanTermYears] = useState<number>(30);
  const [propertyTaxRate, setPropertyTaxRate] = useState<number>(1.2);
  const [homeInsuranceAnnual, setHomeInsuranceAnnual] = useState<number>(1400);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // FHA Calculations
  const calculations = useMemo(() => {
    const downAmount = homePrice * (downPercent / 100);
    const baseLoan = Math.max(0, homePrice - downAmount);
    
    // Statutory 1.75% Upfront MIP
    const upfrontMip = baseLoan * 0.0175;
    const totalFinancedLoan = baseLoan + upfrontMip;

    // Monthly Amortization
    const monthlyRate = (interestRate / 100) / 12;
    const totalMonths = loanTermYears * 12;
    
    const monthlyPI =
      monthlyRate > 0 && totalMonths > 0
        ? (totalFinancedLoan * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
          (Math.pow(1 + monthlyRate, totalMonths) - 1)
        : totalFinancedLoan / totalMonths;

    // Annual MIP Rate Tier
    // < 5% down: 0.55% | >= 5% down: 0.50% (for 30-year terms)
    const annualMipBps = downPercent < 5.0 ? 0.0055 : 0.0050;
    const monthlyMip = (baseLoan * annualMipBps) / 12;

    const monthlyTax = (homePrice * (propertyTaxRate / 100)) / 12;
    const monthlyInsurance = homeInsuranceAnnual / 12;
    const totalMonthlyPayment = monthlyPI + monthlyMip + monthlyTax + monthlyInsurance;

    const fiveYearMipTotal = monthlyMip * 60;
    const isPermanentMip = downPercent < 10.0;

    return {
      downAmount,
      baseLoan,
      upfrontMip,
      totalFinancedLoan,
      monthlyPI,
      annualMipBps,
      monthlyMip,
      monthlyTax,
      monthlyInsurance,
      totalMonthlyPayment,
      fiveYearMipTotal,
      isPermanentMip,
    };
  }, [homePrice, downPercent, interestRate, loanTermYears, propertyTaxRate, homeInsuranceAnnual]);

  const handleCopy = useCallback(() => {
    const text = [
      `🏡 FHA Mortgage Breakdown for $${homePrice.toLocaleString()} Home:`,
      `---------------------------------`,
      `Total Monthly Payment (PITI + MIP): $${calculations.totalMonthlyPayment.toFixed(2)}/mo`,
      `• Principal & Interest: $${calculations.monthlyPI.toFixed(2)}/mo`,
      `• Monthly FHA MIP (${(calculations.annualMipBps * 100).toFixed(2)}%): $${calculations.monthlyMip.toFixed(2)}/mo`,
      `• Property Taxes: $${calculations.monthlyTax.toFixed(2)}/mo`,
      `• Homeowners Insurance: $${calculations.monthlyInsurance.toFixed(2)}/mo`,
      `---------------------------------`,
      `Down Payment (${downPercent}%): $${calculations.downAmount.toLocaleString()}`,
      `Base Loan: $${calculations.baseLoan.toLocaleString()}`,
      `Financed Upfront MIP (1.75%): $${calculations.upfrontMip.toFixed(2)}`,
      `Total Financed Mortgage: $${calculations.totalFinancedLoan.toFixed(2)}`,
      `MIP Expiration: ${calculations.isPermanentMip ? "Life of Loan (Permanent)" : "Expires after 11 Years (HUD 10% Down Rule)"}`,
      `5-Year MIP Total: $${calculations.fiveYearMipTotal.toFixed(2)}`,
      `---------------------------------`,
      `Calculated 100% Free & Client-Side at LocalTools`
    ].join("\n");

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [homePrice, downPercent, calculations]);

  const handleReset = useCallback(() => {
    setHomePrice(350000);
    setDownPercent(3.5);
    setInterestRate(6.5);
    setLoanTermYears(30);
    setPropertyTaxRate(1.2);
    setHomeInsuranceAnnual(1400);
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 py-6 font-sans antialiased text-slate-100">
      {/* Top HUD Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wide uppercase text-slate-200">
                {tool.title}
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                100% Client-Side
              </span>
            </div>
            <p className="text-xs text-slate-400">
              HUD-compliant 1.75% Upfront MIP &amp; 0.55% annual mortgage insurance calculator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zero Server Data Retention</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Input Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-5 bg-slate-900/80 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Loan &amp; Purchase Parameters
            </span>
            <button
              onClick={handleReset}
              className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Home Purchase Price */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Home Purchase Price ($)
            </label>
            <input
              type="number"
              value={homePrice}
              onChange={(e) => setHomePrice(Math.max(10000, Number(e.target.value)))}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:border-emerald-500 focus:outline-none"
            />
            <div className="flex gap-2 pt-1">
              {[250000, 350000, 450000, 600000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setHomePrice(preset)}
                  className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-emerald-400"
                >
                  ${preset / 1000}k
                </button>
              ))}
            </div>
          </div>

          {/* Down Payment % */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-medium text-slate-300">
                Down Payment ({downPercent}%)
              </label>
              <span className="font-mono text-emerald-400 font-bold">
                ${calculations.downAmount.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="3.5"
              max="25.0"
              step="0.5"
              value={downPercent}
              onChange={(e) => setDownPercent(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="flex gap-1.5 pt-1">
              {[
                { label: "3.5% (Min)", val: 3.5 },
                { label: "5.0%", val: 5.0 },
                { label: "10% (11-Yr)", val: 10.0 },
                { label: "20% (No MIP)", val: 20.0 },
              ].map((pill) => (
                <button
                  key={pill.val}
                  type="button"
                  onClick={() => setDownPercent(pill.val)}
                  className={`px-2 py-1 rounded border text-[10px] font-mono transition-colors ${
                    downPercent === pill.val
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interest Rate & Term */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Fixed APR (%)
              </label>
              <input
                type="number"
                step="0.125"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Loan Term (Years)
              </label>
              <select
                value={loanTermYears}
                onChange={(e) => setLoanTermYears(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
              >
                <option value={30}>30 Years (Fixed)</option>
                <option value={15}>15 Years (Fixed)</option>
              </select>
            </div>
          </div>

          {/* Property Tax Rate & Hazard Insurance */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Property Tax Rate (%/yr)
              </label>
              <input
                type="number"
                step="0.1"
                value={propertyTaxRate}
                onChange={(e) => setPropertyTaxRate(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Home Insurance ($/yr)
              </label>
              <input
                type="number"
                value={homeInsuranceAnnual}
                onChange={(e) => setHomeInsuranceAnnual(Math.max(0, Number(e.target.value)))}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Output Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Hero Card */}
          <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl overflow-hidden">
            <div className="absolute -right-8 -top-8 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Total Monthly Housing Payment (PITI + MIP)
              </span>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 font-mono text-xs text-slate-300">
                <Building className="w-3.5 h-3.5 text-emerald-400" />
                FHA Approved
              </div>
            </div>

            <div className="my-6">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-mono tracking-tight text-emerald-400">
                ${calculations.totalMonthlyPayment.toFixed(2)}
                <span className="text-lg font-normal text-slate-400"> / mo</span>
              </div>
              <p className="text-xs text-slate-400 mt-2 font-mono">
                Principal &amp; Interest: ${calculations.monthlyPI.toFixed(2)} + Monthly FHA MIP: ${calculations.monthlyMip.toFixed(2)}
              </p>
            </div>

            {/* Key Sub-metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-800/80">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <span className="text-xs text-slate-400 block mb-1">Financed 1.75% UFMIP</span>
                <span className="text-base font-bold font-mono text-slate-100">
                  ${calculations.upfrontMip.toFixed(2)}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <span className="text-xs text-slate-400 block mb-1">Total Financed Debt</span>
                <span className="text-base font-bold font-mono text-slate-100">
                  ${calculations.totalFinancedLoan.toFixed(2)}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <span className="text-xs text-slate-400 block mb-1">5-Year MIP Total</span>
                <span className="text-base font-bold font-mono text-amber-400">
                  ${calculations.fiveYearMipTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* MIP Expiration Notice */}
            <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-2.5 text-xs">
              <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${calculations.isPermanentMip ? "text-amber-400" : "text-emerald-400"}`} />
              <div className="text-slate-300">
                <strong className={calculations.isPermanentMip ? "text-amber-300" : "text-emerald-300"}>
                  {calculations.isPermanentMip ? "Life of Loan MIP (Permanent)" : "11-Year Automatic Cancellation"}
                </strong>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  {calculations.isPermanentMip
                    ? "With less than 10% down, HUD regulations mandate that FHA annual MIP persists for the full 30 years. Refinance into conventional once equity reaches 20% to cancel."
                    : "With 10% or more down, annual MIP terminates automatically after 11 years under statutory HUD guidelines."}
                </p>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-xs font-semibold text-slate-200 transition-colors shadow-sm"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? "Copied Breakdown!" : "Copy Breakdown"}</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </button>
            </div>

            <Link
              href={`/tools/${tool.category}/${tool.slug}/guide/`}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read Full FHA Mortgage Guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
