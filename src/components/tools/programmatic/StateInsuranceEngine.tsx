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
  Shield,
  Car,
  Home,
  Heart,
  TrendingDown,
  Layers,
} from "lucide-react";
import type { ToolDefinition } from "@/lib/tools-registry";
import { US_INSURANCE_DATA, type StateInsuranceData } from "@/data/programmatic/us-insurance";

interface StateInsuranceEngineProps {
  tool: ToolDefinition;
}

export default function StateInsuranceEngine({ tool }: StateInsuranceEngineProps) {
  // Extract state slug from tool slug
  const stateData: StateInsuranceData = useMemo(() => {
    const matchedState = US_INSURANCE_DATA.find((s) => tool.slug.startsWith(s.slug));
    return matchedState || US_INSURANCE_DATA[0];
  }, [tool.slug]);

  const calcType = useMemo(() => {
    if (tool.slug.includes("car-insurance")) return "car-insurance";
    if (tool.slug.includes("home-insurance")) return "home-insurance";
    if (tool.slug.includes("auto-refinance")) return "auto-refinance";
    return "term-life";
  }, [tool.slug]);

  // Car Insurance States
  const [carCoverageTier, setCarCoverageTier] = useState<"minimum" | "standard" | "full">("full");
  const [driverAge, setDriverAge] = useState<number>(35);
  const [cleanDrivingRecord, setCleanDrivingRecord] = useState<boolean>(true);

  // Home Insurance States
  const [dwellingValue, setDwellingValue] = useState<number>(375000);
  const [homeDeductible, setHomeDeductible] = useState<number>(1000);

  // Auto Refinance States
  const [currentLoanBalance, setCurrentLoanBalance] = useState<number>(28000);
  const [currentInterestRate, setCurrentInterestRate] = useState<number>(9.5);
  const [newInterestRate, setNewInterestRate] = useState<number>(stateData.avgAutoLoanRate);
  const [remainingMonths, setRemainingMonths] = useState<number>(48);

  // Term Life States
  const [annualIncome, setAnnualIncome] = useState<number>(95000);
  const [outstandingDebt, setOutstandingDebt] = useState<number>(25000);
  const [mortgageBalance, setMortgageBalance] = useState<number>(280000);
  const [collegeFundKids, setCollegeFundKids] = useState<number>(2);

  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Reactive Calculations
  const results = useMemo(() => {
    if (calcType === "car-insurance") {
      let base = stateData.avgAnnualCarInsurance;
      if (carCoverageTier === "minimum") base *= 0.52;
      if (carCoverageTier === "standard") base *= 0.80;
      if (!cleanDrivingRecord) base *= 1.45;
      if (driverAge < 25) base *= 1.65;
      else if (driverAge > 65) base *= 1.15;

      const monthlyPremium = base / 12;

      return {
        heroLabel: `${stateData.stateName} Estimated Car Insurance`,
        heroVal: `$${Math.round(base).toLocaleString()} / yr`,
        heroSub: `~$${Math.round(monthlyPremium).toLocaleString()} / month (${carCoverageTier.toUpperCase()} coverage in ${stateData.stateCode})`,
        stat1Label: "State Min Liability",
        stat1Val: `${stateData.minLiabilityBodilyPerPerson}/${stateData.minLiabilityBodilyTotal}/${stateData.minLiabilityProperty}`,
        stat2Label: "State Average Premium",
        stat2Val: `$${stateData.avgAnnualCarInsurance.toLocaleString()}/yr`,
        stat3Label: "Regulator",
        stat3Val: stateData.statutoryInsuranceRegulator.split(" ")[0] || "State DOI",
        color: "text-indigo-400",
      };
    }

    if (calcType === "home-insurance") {
      // Scale state baseline insurance by dwelling value
      const factor = dwellingValue / 350000;
      const deductibleDiscount = homeDeductible >= 2500 ? 0.88 : homeDeductible >= 1500 ? 0.94 : 1.0;
      const estimatedAnnual = stateData.avgAnnualHomeInsurance * factor * deductibleDiscount;
      const monthlyEst = estimatedAnnual / 12;

      return {
        heroLabel: `${stateData.stateName} Home Insurance Estimate`,
        heroVal: `$${Math.round(estimatedAnnual).toLocaleString()} / yr`,
        heroSub: `~$${Math.round(monthlyEst).toLocaleString()} / mo for $${dwellingValue.toLocaleString()} dwelling coverage`,
        stat1Label: "Dwelling Base (Cov A)",
        stat1Val: `$${dwellingValue.toLocaleString()}`,
        stat2Label: "State Avg on $350k",
        stat2Val: `$${stateData.avgAnnualHomeInsurance.toLocaleString()}/yr`,
        stat3Label: "Selected Deductible",
        stat3Val: `$${homeDeductible.toLocaleString()}`,
        color: "text-emerald-400",
      };
    }

    if (calcType === "auto-refinance") {
      // Amortization before and after refi
      const oldRateMonthly = (currentInterestRate / 100) / 12;
      const newRateMonthly = (newInterestRate / 100) / 12;

      const oldPayment =
        oldRateMonthly > 0
          ? (currentLoanBalance * (oldRateMonthly * Math.pow(1 + oldRateMonthly, remainingMonths))) /
            (Math.pow(1 + oldRateMonthly, remainingMonths) - 1)
          : currentLoanBalance / remainingMonths;

      const newPayment =
        newRateMonthly > 0
          ? (currentLoanBalance * (newRateMonthly * Math.pow(1 + newRateMonthly, remainingMonths))) /
            (Math.pow(1 + newRateMonthly, remainingMonths) - 1)
          : currentLoanBalance / remainingMonths;

      const monthlySavings = Math.max(0, oldPayment - newPayment);
      const totalSavingsLifetime = monthlySavings * remainingMonths;

      return {
        heroLabel: "Lifetime Auto Refinance Savings",
        heroVal: `$${Math.round(totalSavingsLifetime).toLocaleString()}`,
        heroSub: `Save ~$${Math.round(monthlySavings).toLocaleString()} / month by dropping APR from ${currentInterestRate}% to ${newInterestRate}%`,
        stat1Label: "Old Monthly Payment",
        stat1Val: `$${Math.round(oldPayment).toLocaleString()}/mo`,
        stat2Label: "New Monthly Payment",
        stat2Val: `$${Math.round(newPayment).toLocaleString()}/mo`,
        stat3Label: "APR Reduction",
        stat3Val: `-${(currentInterestRate - newInterestRate).toFixed(2)}% APR`,
        color: "text-cyan-400",
      };
    }

    // Default: Term Life DIME Method
    // Debt + Income (10x) + Mortgage + Education ($100k per child)
    const incomeReplacement = annualIncome * 10;
    const educationFund = collegeFundKids * 100000;
    const totalDimeNeed = outstandingDebt + incomeReplacement + mortgageBalance + educationFund;

    return {
      heroLabel: `${stateData.stateName} Term Life Need (DIME)`,
      heroVal: `$${(totalDimeNeed / 1000000).toFixed(2)}M`,
      heroSub: `Total coverage recommended: $${totalDimeNeed.toLocaleString()} across 20-30 year term`,
      stat1Label: "Income Replacement (10x)",
      stat1Val: `$${(incomeReplacement / 1000).toFixed(0)}k`,
      stat2Label: "Mortgage & Debts",
      stat2Val: `$${((mortgageBalance + outstandingDebt) / 1000).toFixed(0)}k`,
      stat3Label: "College Education",
      stat3Val: `$${(educationFund / 1000).toFixed(0)}k`,
      color: "text-teal-400",
    };
  }, [
    calcType,
    stateData,
    carCoverageTier,
    driverAge,
    cleanDrivingRecord,
    dwellingValue,
    homeDeductible,
    currentLoanBalance,
    currentInterestRate,
    newInterestRate,
    remainingMonths,
    annualIncome,
    outstandingDebt,
    mortgageBalance,
    collegeFundKids,
  ]);

  const handleCopy = useCallback(() => {
    const text = [
      `🛡️ ${tool.title}:`,
      `---------------------------------`,
      `${results.heroLabel}: ${results.heroVal}`,
      `Details: ${results.heroSub}`,
      `• ${results.stat1Label}: ${results.stat1Val}`,
      `• ${results.stat2Label}: ${results.stat2Val}`,
      `• ${results.stat3Label}: ${results.stat3Val}`,
      `---------------------------------`,
      `State: ${stateData.stateName} (${stateData.stateCode})`,
      `Calculated 100% Free & Client-Side at LocalTools`
    ].join("\n");

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [tool.title, results, stateData]);

  const handleReset = useCallback(() => {
    setCarCoverageTier("full");
    setDriverAge(35);
    setCleanDrivingRecord(true);
    setDwellingValue(375000);
    setHomeDeductible(1000);
    setCurrentLoanBalance(28000);
    setCurrentInterestRate(9.5);
    setNewInterestRate(stateData.avgAutoLoanRate);
    setRemainingMonths(48);
    setAnnualIncome(95000);
    setOutstandingDebt(25000);
    setMortgageBalance(280000);
    setCollegeFundKids(2);
  }, [stateData]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 py-6 font-sans antialiased text-slate-100">
      {/* Top HUD Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-teal-500/20 border border-indigo-500/30 text-indigo-400">
            {calcType === "car-insurance" && <Car className="w-5 h-5" />}
            {calcType === "home-insurance" && <Home className="w-5 h-5" />}
            {calcType === "auto-refinance" && <TrendingDown className="w-5 h-5" />}
            {calcType === "term-life" && <Heart className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wide uppercase text-slate-200">
                {tool.title}
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                {stateData.stateCode} · 100% Client-Side
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Statutory regulations and benchmarks for {stateData.stateName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zero Server Tracking</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Input Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-5 bg-slate-900/80 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              {stateData.stateName} Policy Inputs
            </span>
            <button
              onClick={handleReset}
              className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* 1. Car Insurance Inputs */}
          {calcType === "car-insurance" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Coverage Tier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["minimum", "standard", "full"] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setCarCoverageTier(tier)}
                      className={`px-3 py-2 rounded-xl text-xs font-mono capitalize transition-all border ${
                        carCoverageTier === tier
                          ? "bg-indigo-600/30 border-indigo-500 text-indigo-300"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <label className="font-medium text-slate-300">Driver Age ({driverAge} yrs)</label>
                </div>
                <input
                  type="range"
                  min="16"
                  max="80"
                  value={driverAge}
                  onChange={(e) => setDriverAge(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={cleanDrivingRecord}
                  onChange={(e) => setCleanDrivingRecord(e.target.checked)}
                  className="accent-indigo-500 rounded"
                />
                <span>Clean Driving Record (No Violations / At-Fault Claims)</span>
              </label>
            </div>
          )}

          {/* 2. Home Insurance Inputs */}
          {calcType === "home-insurance" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Dwelling Rebuild Coverage A ($)
                </label>
                <input
                  type="number"
                  value={dwellingValue}
                  onChange={(e) => setDwellingValue(Math.max(50000, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:border-emerald-500 focus:outline-none"
                />
                <div className="flex gap-2 mt-2">
                  {[250000, 350000, 500000, 750000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDwellingValue(preset)}
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-emerald-400"
                    >
                      ${preset / 1000}k
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Policy Deductible ($)
                </label>
                <select
                  value={homeDeductible}
                  onChange={(e) => setHomeDeductible(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                >
                  <option value={500}>$500 Deductible</option>
                  <option value={1000}>$1,000 Deductible (Standard)</option>
                  <option value={1500}>$1,500 Deductible</option>
                  <option value={2500}>$2,500 Deductible (Lower Premium)</option>
                </select>
              </div>
            </div>
          )}

          {/* 3. Auto Refinance Inputs */}
          {calcType === "auto-refinance" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Remaining Auto Loan Balance ($)
                </label>
                <input
                  type="number"
                  value={currentLoanBalance}
                  onChange={(e) => setCurrentLoanBalance(Math.max(1000, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Current APR (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={currentInterestRate}
                    onChange={(e) => setCurrentInterestRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    New Refi APR (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newInterestRate}
                    onChange={(e) => setNewInterestRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Remaining Loan Term ({remainingMonths} months)
                </label>
                <input
                  type="range"
                  min="12"
                  max="72"
                  step="6"
                  value={remainingMonths}
                  onChange={(e) => setRemainingMonths(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>
          )}

          {/* 4. Term Life Inputs */}
          {calcType === "term-life" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Annual Household Income ($)
                </label>
                <input
                  type="number"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(Math.max(10000, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Mortgage Balance ($)
                  </label>
                  <input
                    type="number"
                    value={mortgageBalance}
                    onChange={(e) => setMortgageBalance(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-sm font-mono focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Other Debts ($)
                  </label>
                  <input
                    type="number"
                    value={outstandingDebt}
                    onChange={(e) => setOutstandingDebt(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-sm font-mono focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Children College Funds ({collegeFundKids} Kids · $100k each)
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={collegeFundKids}
                  onChange={(e) => setCollegeFundKids(Number(e.target.value))}
                  className="w-full accent-teal-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Output Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Hero Card */}
          <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl overflow-hidden">
            <div className="absolute -right-8 -top-8 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                {results.heroLabel}
              </span>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 font-mono text-xs text-slate-300">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                {stateData.stateName} Verified
              </div>
            </div>

            <div className="my-6">
              <div className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold font-mono tracking-tight ${results.color}`}>
                {results.heroVal}
              </div>
              <p className="text-xs text-slate-400 mt-2 font-mono">
                {results.heroSub}
              </p>
            </div>

            {/* Key Sub-metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-800/80">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <span className="text-xs text-slate-400 block mb-1">{results.stat1Label}</span>
                <span className="text-base font-bold font-mono text-slate-100">{results.stat1Val}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <span className="text-xs text-slate-400 block mb-1">{results.stat2Label}</span>
                <span className="text-base font-bold font-mono text-slate-100">{results.stat2Val}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <span className="text-xs text-slate-400 block mb-1">{results.stat3Label}</span>
                <span className="text-base font-bold font-mono text-indigo-400">{results.stat3Val}</span>
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
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read {stateData.stateName} Insurance Guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
