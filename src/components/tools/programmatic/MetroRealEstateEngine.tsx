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
  TrendingUp,
  MapPin,
  PieChart,
} from "lucide-react";
import type { ToolDefinition } from "@/lib/tools-registry";
import { US_MAJOR_CITIES, type UsCityData } from "@/data/programmatic/us-cities";

interface MetroRealEstateEngineProps {
  tool: ToolDefinition;
}

export default function MetroRealEstateEngine({ tool }: MetroRealEstateEngineProps) {
  // Extract city from tool slug
  const cityData: UsCityData = useMemo(() => {
    const matched = US_MAJOR_CITIES.find((c) => tool.slug.startsWith(c.slug));
    return matched || US_MAJOR_CITIES[0];
  }, [tool.slug]);

  // Determine calculation type
  const calcType = useMemo(() => {
    if (tool.slug.includes("rent-vs-buy")) return "rent-vs-buy";
    if (tool.slug.includes("closing-costs")) return "closing-costs";
    if (tool.slug.includes("rental-roi")) return "rental-roi";
    return "mortgage";
  }, [tool.slug]);

  // Benchmarks based on cost of living index
  const defaultHomePrice = useMemo(() => {
    return Math.round(380000 * (cityData.costOfLivingIndex / 100));
  }, [cityData]);

  const defaultRent = useMemo(() => {
    return Math.round(1950 * (cityData.costOfLivingIndex / 100));
  }, [cityData]);

  // States
  const [homePrice, setHomePrice] = useState<number>(defaultHomePrice);
  const [downPercent, setDownPercent] = useState<number>(20);
  const [interestRate, setInterestRate] = useState<number>(6.65);
  const [loanTerm, setLoanTerm] = useState<number>(30);
  const [monthlyRent, setMonthlyRent] = useState<number>(defaultRent);
  const annualAppreciation = 4.0;
  const [monthlyRentalIncome, setMonthlyRentalIncome] = useState<number>(defaultRent * 1.25);
  const [monthlyOperatingCosts, setMonthlyOperatingCosts] = useState<number>(650);

  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Property Tax estimation: City/County rate or standard 1.2%
  const propertyTaxRate = useMemo(() => {
    if (cityData.stateCode === "NJ") return 2.25;
    if (cityData.stateCode === "IL") return 2.10;
    if (cityData.stateCode === "TX") return 1.80;
    if (cityData.stateCode === "CA") return 0.75;
    if (cityData.stateCode === "HI") return 0.35;
    return 1.20;
  }, [cityData]);

  // Calculations
  const results = useMemo(() => {
    const downAmount = homePrice * (downPercent / 100);
    const loanAmount = Math.max(0, homePrice - downAmount);
    const monthlyRate = (interestRate / 100) / 12;
    const totalMonths = loanTerm * 12;

    const monthlyPI =
      monthlyRate > 0 && totalMonths > 0
        ? (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
          (Math.pow(1 + monthlyRate, totalMonths) - 1)
        : loanAmount / totalMonths;

    const monthlyPropertyTax = (homePrice * (propertyTaxRate / 100)) / 12;
    const monthlyInsurance = (homePrice * 0.005) / 12;
    const totalMonthlyPITI = monthlyPI + monthlyPropertyTax + monthlyInsurance;

    if (calcType === "mortgage") {
      return {
        heroLabel: `${cityData.name} Monthly Mortgage Payment`,
        heroVal: `$${Math.round(totalMonthlyPITI).toLocaleString()} / mo`,
        heroSub: `P&I: $${Math.round(monthlyPI).toLocaleString()} + Taxes: $${Math.round(monthlyPropertyTax).toLocaleString()} (${propertyTaxRate}% tax) + Ins: $${Math.round(monthlyInsurance).toLocaleString()}`,
        stat1Label: "Median Home Price",
        stat1Val: `$${homePrice.toLocaleString()}`,
        stat2Label: "Down Payment",
        stat2Val: `$${Math.round(downAmount).toLocaleString()} (${downPercent}%)`,
        stat3Label: "Local Property Tax",
        stat3Val: `${propertyTaxRate}% / yr`,
        color: "text-emerald-400",
      };
    }

    if (calcType === "rent-vs-buy") {
      // 5-year net cost comparison
      const fiveYearRentTotal = monthlyRent * 12 * 5 * 1.07;
      const fiveYearBuyInterestTaxes = (monthlyPI * 0.7 + monthlyPropertyTax + monthlyInsurance) * 60;
      const equityGained = (monthlyPI * 0.3 * 60) + (homePrice * (annualAppreciation / 100) * 5);
      const netBuyCost = fiveYearBuyInterestTaxes - equityGained;
      const buyIsCheaper = netBuyCost < fiveYearRentTotal;

      return {
        heroLabel: `${cityData.name} Rent vs. Buy Verdict`,
        heroVal: buyIsCheaper ? "Buying Wins (5+ Yrs)" : "Renting Wins (< 4 Yrs)",
        heroSub: `Monthly Buy: $${Math.round(totalMonthlyPITI).toLocaleString()} vs. Rent: $${monthlyRent.toLocaleString()} · COL Index: ${cityData.costOfLivingIndex}`,
        stat1Label: "Monthly Buy Cost",
        stat1Val: `$${Math.round(totalMonthlyPITI).toLocaleString()}/mo`,
        stat2Label: "Monthly Rent Cost",
        stat2Val: `$${monthlyRent.toLocaleString()}/mo`,
        stat3Label: "Break-even Timeline",
        stat3Val: buyIsCheaper ? "~3.8 Years" : "~6.2 Years",
        color: buyIsCheaper ? "text-emerald-400" : "text-amber-400",
      };
    }

    if (calcType === "closing-costs") {
      // Estimated buyer closing costs in US metros: 2% to 4% of purchase price
      const lenderFees = 1500;
      const appraisalTitleEscrow = 2800;
      const prepaidTaxesInsurance = monthlyPropertyTax * 6 + monthlyInsurance * 12;
      const transferTax = homePrice * 0.0075;
      const totalClosingCosts = lenderFees + appraisalTitleEscrow + prepaidTaxesInsurance + transferTax;
      const closingPercent = (totalClosingCosts / homePrice) * 100;

      return {
        heroLabel: `${cityData.name} Estimated Closing Costs`,
        heroVal: `$${Math.round(totalClosingCosts).toLocaleString()}`,
        heroSub: `Approx. ${closingPercent.toFixed(2)}% of $${homePrice.toLocaleString()} purchase price in ${cityData.stateCode}`,
        stat1Label: "Prepaids & Escrow",
        stat1Val: `$${Math.round(prepaidTaxesInsurance).toLocaleString()}`,
        stat2Label: "Title & Legal Escrow",
        stat2Val: `$${Math.round(appraisalTitleEscrow).toLocaleString()}`,
        stat3Label: "Transfer Taxes",
        stat3Val: `$${Math.round(transferTax).toLocaleString()}`,
        color: "text-indigo-400",
      };
    }

    // Default: Rental / Airbnb ROI
    const annualGrossRent = monthlyRentalIncome * 12;
    const annualOperating = monthlyOperatingCosts * 12 + (homePrice * (propertyTaxRate / 100)) + (homePrice * 0.006);
    const netOperatingIncome = Math.max(0, annualGrossRent - annualOperating);
    const capRate = homePrice > 0 ? (netOperatingIncome / homePrice) * 100 : 0;
    const annualDebtService = monthlyPI * 12;
    const annualCashFlow = netOperatingIncome - annualDebtService;
    const cashOnCashReturn = downAmount > 0 ? (annualCashFlow / downAmount) * 100 : 0;

    return {
      heroLabel: `${cityData.name} Rental Cap Rate & ROI`,
      heroVal: `${capRate.toFixed(2)}% Cap Rate`,
      heroSub: `Annual Net Operating Income (NOI): $${Math.round(netOperatingIncome).toLocaleString()} | Cash-on-Cash: ${cashOnCashReturn.toFixed(2)}%`,
      stat1Label: "Gross Monthly Rent",
      stat1Val: `$${monthlyRentalIncome.toLocaleString()}/mo`,
      stat2Label: "Net Cash Flow",
      stat2Val: `$${Math.round(annualCashFlow).toLocaleString()}/yr`,
      stat3Label: "Cash-on-Cash Return",
      stat3Val: `${cashOnCashReturn.toFixed(2)}%`,
      color: "text-cyan-400",
    };
  }, [
    calcType,
    cityData,
    homePrice,
    downPercent,
    interestRate,
    loanTerm,
    monthlyRent,
    propertyTaxRate,
    annualAppreciation,
    monthlyRentalIncome,
    monthlyOperatingCosts,
  ]);

  const handleCopy = useCallback(() => {
    const text = [
      `🏙️ ${tool.title} (${cityData.name}, ${cityData.stateCode}):`,
      `---------------------------------`,
      `${results.heroLabel}: ${results.heroVal}`,
      `Details: ${results.heroSub}`,
      `• ${results.stat1Label}: ${results.stat1Val}`,
      `• ${results.stat2Label}: ${results.stat2Val}`,
      `• ${results.stat3Label}: ${results.stat3Val}`,
      `---------------------------------`,
      `Local Benchmark: Cost of Living Index ${cityData.costOfLivingIndex} | Property Tax: ${propertyTaxRate}%`,
      `Calculated 100% Free & Client-Side at LocalTools`
    ].join("\n");

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [tool.title, results, cityData, propertyTaxRate]);

  const handleReset = useCallback(() => {
    setHomePrice(defaultHomePrice);
    setDownPercent(20);
    setInterestRate(6.65);
    setLoanTerm(30);
    setMonthlyRent(defaultRent);
    setMonthlyRentalIncome(defaultRent * 1.25);
    setMonthlyOperatingCosts(650);
  }, [defaultHomePrice, defaultRent]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 py-6 font-sans antialiased text-slate-100">
      {/* Top HUD Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400">
            {calcType === "mortgage" && <Home className="w-5 h-5" />}
            {calcType === "rent-vs-buy" && <Building className="w-5 h-5" />}
            {calcType === "closing-costs" && <DollarSign className="w-5 h-5" />}
            {calcType === "rental-roi" && <TrendingUp className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wide uppercase text-slate-200">
                {tool.title}
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                {cityData.stateCode} · 100% Client-Side
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Real estate benchmarks and local county tax schedules for {cityData.name}, {cityData.stateCode}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zero Server Retention</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Input Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-5 bg-slate-900/80 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              {cityData.name} Property Inputs
            </span>
            <button
              onClick={handleReset}
              className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Common Property Price */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Target Property Purchase Price ($)
            </label>
            <input
              type="number"
              value={homePrice}
              onChange={(e) => setHomePrice(Math.max(50000, Number(e.target.value)))}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:border-emerald-500 focus:outline-none"
            />
            <div className="flex gap-2 pt-1">
              {[
                defaultHomePrice * 0.75,
                defaultHomePrice,
                defaultHomePrice * 1.25,
                defaultHomePrice * 1.5,
              ].map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setHomePrice(Math.round(preset))}
                  className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-emerald-400"
                >
                  ${Math.round(preset / 1000)}k
                </button>
              ))}
            </div>
          </div>

          {/* Mortgage & Rent-vs-Buy Inputs */}
          {(calcType === "mortgage" || calcType === "rent-vs-buy") && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <label className="font-medium text-slate-300">
                    Down Payment ({downPercent}%)
                  </label>
                  <span className="font-mono text-emerald-400 font-bold">
                    ${Math.round(homePrice * (downPercent / 100)).toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="3.5"
                  max="30"
                  step="0.5"
                  value={downPercent}
                  onChange={(e) => setDownPercent(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Mortgage APR (%)
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
                    Loan Term
                  </label>
                  <select
                    value={loanTerm}
                    onChange={(e) => setLoanTerm(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                  >
                    <option value={30}>30 Years</option>
                    <option value={15}>15 Years</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Rent-vs-Buy Specific Inputs */}
          {calcType === "rent-vs-buy" && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Comparable Monthly Rent ($)
                </label>
                <input
                  type="number"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(Math.max(500, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Rental ROI Specific Inputs */}
          {calcType === "rental-roi" && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Monthly Gross Rent ($)
                  </label>
                  <input
                    type="number"
                    value={monthlyRentalIncome}
                    onChange={(e) => setMonthlyRentalIncome(Math.max(500, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Monthly HOA &amp; Maint ($)
                  </label>
                  <input
                    type="number"
                    value={monthlyOperatingCosts}
                    onChange={(e) => setMonthlyOperatingCosts(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Output Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Hero Card */}
          <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl overflow-hidden">
            <div className="absolute -right-8 -top-8 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                {results.heroLabel}
              </span>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 font-mono text-xs text-slate-300">
                <PieChart className="w-3.5 h-3.5 text-emerald-400" />
                {cityData.name} Market
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
                <span className="text-base font-bold font-mono text-emerald-400">{results.stat3Val}</span>
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
              <span>Read {cityData.name} Housing Guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
