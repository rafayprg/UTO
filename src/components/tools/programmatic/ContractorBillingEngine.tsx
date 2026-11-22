"use client";

import { useState, useMemo, useCallback } from "react";
import { CONTRACTOR_BILLING_TOOLS, type ContractorBillingToolData } from "@/data/programmatic/contractor-billing";
import type { ToolDefinition } from "@/lib/tools-registry";
import {
  Briefcase,
  ShieldCheck,
  DollarSign,
  Copy,
  Check,
  Printer,
  RotateCcw,
  Sparkles,
  BarChart3,
  TrendingUp,
} from "lucide-react";

export default function ContractorBillingEngine({ tool }: { tool: ToolDefinition }) {
  const currentToolData: ContractorBillingToolData = useMemo(() => {
    return (
      CONTRACTOR_BILLING_TOOLS.find((t) => t.slug === tool.slug) ||
      CONTRACTOR_BILLING_TOOLS[0]
    );
  }, [tool.slug]);

  const calcType = currentToolData.calcType;

  // 1. Freelance Rate States
  const [desiredNet, setDesiredNet] = useState<number>(
    Number(currentToolData.defaultInputs.desiredNetIncome || 85000)
  );
  const [businessExpenses, setBusinessExpenses] = useState<number>(
    Number(currentToolData.defaultInputs.annualBusinessExpenses || 12000)
  );
  const [healthInsurance, setHealthInsurance] = useState<number>(
    Number(currentToolData.defaultInputs.healthInsuranceAnnual || 6000)
  );
  const [seTaxRate, setSeTaxRate] = useState<number>(
    Number(currentToolData.defaultInputs.selfEmploymentTaxRate || 15.3)
  );
  const [incomeTaxRate, setIncomeTaxRate] = useState<number>(
    Number(currentToolData.defaultInputs.incomeTaxEffectiveRate || 14.0)
  );
  const [vacationWeeks, setVacationWeeks] = useState<number>(
    Number(currentToolData.defaultInputs.weeksVacationAndSick || 4)
  );
  const [billableHoursPerWeek, setBillableHoursPerWeek] = useState<number>(
    Number(currentToolData.defaultInputs.billableHoursPerWeek || 25)
  );

  // 2. W2 vs 1099 States
  const [w2Salary, setW2Salary] = useState<number>(
    Number(currentToolData.defaultInputs.w2Salary || 100000)
  );
  const [w2Health, setW2Health] = useState<number>(
    Number(currentToolData.defaultInputs.w2HealthBenefitValue || 8000)
  );
  const [w2Match, setW2Match] = useState<number>(
    Number(currentToolData.defaultInputs.w2Employer401kMatch || 4000)
  );
  const [w2PtoDays, setW2PtoDays] = useState<number>(
    Number(currentToolData.defaultInputs.w2PaidDaysOff || 20)
  );
  const [contractorOverhead, setContractorOverhead] = useState<number>(
    Number(currentToolData.defaultInputs.contractorExpenses || 5000)
  );

  // 3. Retainer Pricing States
  const [standardHourly, setStandardHourly] = useState<number>(
    Number(currentToolData.defaultInputs.standardHourlyRate || 150)
  );
  const [committedHours, setCommittedHours] = useState<number>(
    Number(currentToolData.defaultInputs.committedMonthlyHours || 20)
  );
  const [retainerDiscount, setRetainerDiscount] = useState<number>(
    Number(currentToolData.defaultInputs.retainerDiscountPercent || 12)
  );
  const [overageRate, setOverageRate] = useState<number>(
    Number(currentToolData.defaultInputs.overageHourlyRate || 175)
  );

  // 4. Late Invoice States
  const [invoiceAmount, setInvoiceAmount] = useState<number>(
    Number(currentToolData.defaultInputs.invoiceAmount || 6500)
  );
  const [annualLateRate, setAnnualLateRate] = useState<number>(
    Number(currentToolData.defaultInputs.annualInterestRate || 18.0)
  );
  const [daysOverdue, setDaysOverdue] = useState<number>(
    Number(currentToolData.defaultInputs.daysOverdue || 45)
  );
  const [flatLateFee, setFlatLateFee] = useState<number>(
    Number(currentToolData.defaultInputs.flatLateFee || 50)
  );

  // 5. Solo 401k vs SEP IRA States
  const [netSelfEmploymentProfit, setNetSelfEmploymentProfit] = useState<number>(
    Number(currentToolData.defaultInputs.netSelfEmploymentProfit || 120000)
  );
  const [age, setAge] = useState<number>(
    Number(currentToolData.defaultInputs.age || 42)
  );
  const [businessStructure, setBusinessStructure] = useState<string>(
    String(currentToolData.defaultInputs.businessStructure || "sole_proprietor")
  );
  const [w2WageSCorp, setW2WageSCorp] = useState<number>(
    Number(currentToolData.defaultInputs.w2WageSCorp || 70000)
  );

  // 6. S-Corp Tax Savings States
  const [netProfitSCorp, setNetProfitSCorp] = useState<number>(
    Number(currentToolData.defaultInputs.netProfit || 150000)
  );
  const [reasonableSalarySCorp, setReasonableSalarySCorp] = useState<number>(
    Number(currentToolData.defaultInputs.reasonableSalary || 70000)
  );
  const [adminOverheadSCorp, setAdminOverheadSCorp] = useState<number>(
    Number(currentToolData.defaultInputs.adminOverhead || 2000)
  );

  // 7. PayPal Fee States
  const [paypalAmount, setPaypalAmount] = useState<number>(
    Number(currentToolData.defaultInputs.amount || 1000)
  );
  const [paypalTier, setPaypalTier] = useState<"invoicing" | "checkout" | "qr">("invoicing");
  const [paypalIsIntl, setPaypalIsIntl] = useState<boolean>(false);
  const [paypalIsReverse, setPaypalIsReverse] = useState<boolean>(false);

  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Calculations
  const results = useMemo(() => {
    if (calcType === "freelance-rate") {
      const workingWeeks = Math.max(1, 52 - vacationWeeks);
      const totalAnnualBillableHours = workingWeeks * billableHoursPerWeek;
      const combinedTaxRate = (seTaxRate + incomeTaxRate) / 100;
      const netMultiplier = Math.max(0.1, 1 - combinedTaxRate);
      const totalRequiredGross = (desiredNet + businessExpenses + healthInsurance) / netMultiplier;
      const minimumHourlyRate = totalAnnualBillableHours > 0 ? totalRequiredGross / totalAnnualBillableHours : 0;
      const taxAmount = totalRequiredGross - (desiredNet + businessExpenses + healthInsurance);

      return {
        heroLabel: "Minimum Target Hourly Rate",
        heroVal: `$${minimumHourlyRate.toFixed(2)} / hr`,
        heroSub: `Based on ${totalAnnualBillableHours.toLocaleString()} annual billable hours (${workingWeeks} weeks)`,
        stat1Label: "Required Gross Revenue",
        stat1Val: `$${Math.round(totalRequiredGross).toLocaleString()}/yr`,
        stat2Label: "Taxes (SE + Income)",
        stat2Val: `$${Math.round(taxAmount).toLocaleString()}`,
        stat3Label: "Overhead & Health",
        stat3Val: `$${(businessExpenses + healthInsurance).toLocaleString()}`,
        color: "text-emerald-400",
      };
    }

    if (calcType === "w2-vs-1099") {
      const employerFica = w2Salary * 0.0765;
      const ptoValue = (w2Salary / 260) * w2PtoDays;
      const equivalent1099Total = w2Salary + w2Health + w2Match + employerFica + contractorOverhead;
      const availableWorkHours = Math.max(1, (260 - w2PtoDays) * 8);
      const equivalentHourly1099 = equivalent1099Total / availableWorkHours;
      const percentagePremium = w2Salary > 0 ? ((equivalent1099Total - w2Salary) / w2Salary) * 100 : 0;

      return {
        heroLabel: "Equivalent 1099 Contractor Rate",
        heroVal: `$${equivalentHourly1099.toFixed(2)} / hr`,
        heroSub: `Gross annual equivalent: $${Math.round(equivalent1099Total).toLocaleString()}/yr (+${percentagePremium.toFixed(1)}% over W-2)`,
        stat1Label: "W-2 Base Salary",
        stat1Val: `$${w2Salary.toLocaleString()}`,
        stat2Label: "FICA + Benefits Offset",
        stat2Val: `$${Math.round(employerFica + w2Health + w2Match).toLocaleString()}`,
        stat3Label: "Paid Days Off Value",
        stat3Val: `$${Math.round(ptoValue).toLocaleString()}`,
        color: "text-indigo-400",
      };
    }

    if (calcType === "retainer-pricing") {
      const discountDecimal = retainerDiscount / 100;
      const baseMonthlyRetainer = committedHours * standardHourly * (1 - discountDecimal);
      const effectiveHourly = committedHours > 0 ? baseMonthlyRetainer / committedHours : 0;
      const annualizedRetainer = baseMonthlyRetainer * 12;

      return {
        heroLabel: "Monthly Retainer Fee",
        heroVal: `$${Math.round(baseMonthlyRetainer).toLocaleString()} / mo`,
        heroSub: `Effective rate: $${effectiveHourly.toFixed(2)}/hr (${retainerDiscount}% loyalty discount)`,
        stat1Label: "Committed Hours",
        stat1Val: `${committedHours} hrs / mo`,
        stat2Label: "Annual Guaranteed Run Rate",
        stat2Val: `$${Math.round(annualizedRetainer).toLocaleString()}/yr`,
        stat3Label: "Overage Hourly Rate",
        stat3Val: `$${overageRate}/hr`,
        color: "text-emerald-400",
      };
    }

    if (calcType === "late-invoice-interest") {
      const dailyRate = (annualLateRate / 100) / 365;
      const totalInterest = invoiceAmount * dailyRate * daysOverdue;
      const totalDue = invoiceAmount + totalInterest + flatLateFee;

      return {
        heroLabel: "Total Balance Now Due",
        heroVal: `$${totalDue.toFixed(2)}`,
        heroSub: `Includes $${totalInterest.toFixed(2)} interest (${daysOverdue} days at ${annualLateRate}% APR) + $${flatLateFee} fee`,
        stat1Label: "Original Invoice",
        stat1Val: `$${invoiceAmount.toLocaleString()}`,
        stat2Label: "Accrued Late Interest",
        stat2Val: `$${totalInterest.toFixed(2)}`,
        stat3Label: "Daily Interest Accrual",
        stat3Val: `$${(invoiceAmount * dailyRate).toFixed(2)}/day`,
        color: "text-rose-400",
      };
    }

    if (calcType === "s-corp-tax-savings") {
      const distribution = Math.max(0, netProfitSCorp - reasonableSalarySCorp);
      const grossFicaSaved = distribution * 0.153;
      const netSavings = grossFicaSaved - adminOverheadSCorp;
      const isProfitable = netSavings > 0;

      return {
        heroLabel: "Net Annual S-Corp Savings",
        heroVal: isProfitable ? `+$${Math.round(netSavings).toLocaleString()} / yr` : `-$${Math.round(Math.abs(netSavings)).toLocaleString()} / yr`,
        heroSub: isProfitable
          ? `Eliminates 15.3% FICA on $${Math.round(distribution).toLocaleString()} distribution, saving $${Math.round(grossFicaSaved).toLocaleString()} minus $${adminOverheadSCorp.toLocaleString()} admin overhead`
          : `Admin overhead ($${adminOverheadSCorp.toLocaleString()}) exceeds FICA savings ($${Math.round(grossFicaSaved).toLocaleString()}). S-Corp election not recommended.`,
        stat1Label: "Shareholder Distribution",
        stat1Val: `$${Math.round(distribution).toLocaleString()}`,
        stat2Label: "Gross FICA Saved (15.3%)",
        stat2Val: `$${Math.round(grossFicaSaved).toLocaleString()}`,
        stat3Label: "Corporate Overhead",
        stat3Val: `$${adminOverheadSCorp.toLocaleString()}/yr`,
        color: isProfitable ? "text-emerald-400" : "text-amber-400",
      };
    }

    if (calcType === "paypal-fee") {
      const basePct = paypalTier === "invoicing" ? 0.0349 : paypalTier === "checkout" ? 0.0299 : 0.019;
      const fixedFee = paypalTier === "invoicing" ? 0.49 : paypalTier === "checkout" ? 0.49 : 0.10;
      const intlSurcharge = paypalIsIntl ? 0.015 : 0;
      const totalPct = basePct + intlSurcharge;

      let fee = 0;
      let net = 0;
      let gross = paypalAmount;

      if (paypalIsReverse) {
        gross = (paypalAmount + fixedFee) / (1 - totalPct);
        fee = gross - paypalAmount;
        net = paypalAmount;
      } else {
        fee = (paypalAmount * totalPct) + fixedFee;
        net = Math.max(0, paypalAmount - fee);
      }

      const effectiveRate = gross > 0 ? (fee / gross) * 100 : 0;

      return {
        heroLabel: paypalIsReverse ? "Amount to Invoice Client" : "Net Settled to PayPal",
        heroVal: paypalIsReverse ? `$${gross.toFixed(2)}` : `$${net.toFixed(2)}`,
        heroSub: `PayPal Fee: $${fee.toFixed(2)} (${effectiveRate.toFixed(2)}% effective drag) · ${paypalTier.toUpperCase()}${paypalIsIntl ? " + Intl (1.5%)" : ""}`,
        stat1Label: paypalIsReverse ? "Target Net Cash" : "Gross Charge",
        stat1Val: `$${paypalAmount.toLocaleString()}`,
        stat2Label: "Total PayPal Deductions",
        stat2Val: `$${fee.toFixed(2)}`,
        stat3Label: "Effective Fee Rate",
        stat3Val: `${effectiveRate.toFixed(2)}%`,
        color: "text-cyan-400",
      };
    }

    // Default: Solo 401(k) vs SEP IRA
    const electiveLimit = age >= 50 ? 31000 : 23500;
    let employerMax = 0;
    if (businessStructure === "sole_proprietor") {
      // 20% of net self employment adjusted for half SE tax
      const seTaxDeduction = (netSelfEmploymentProfit * 0.9235 * 0.153) / 2;
      const adjustedProfit = Math.max(0, netSelfEmploymentProfit - seTaxDeduction);
      employerMax = adjustedProfit * 0.20;
    } else {
      // S-Corp: 25% of W-2
      employerMax = w2WageSCorp * 0.25;
    }

    const overallIrsCap = age >= 50 ? 76500 : 69000;
    const solo401kMax = Math.min(overallIrsCap, electiveLimit + employerMax);
    const sepIraMax = Math.min(overallIrsCap, employerMax);
    const soloAdvantage = Math.max(0, solo401kMax - sepIraMax);

    return {
      heroLabel: "Max Solo 401(k) Contribution",
      heroVal: `$${Math.round(solo401kMax).toLocaleString()}`,
      heroSub: `Solo 401(k) allows +$${Math.round(soloAdvantage).toLocaleString()} more than SEP IRA at this income`,
      stat1Label: "Employee Deferral",
      stat1Val: `$${electiveLimit.toLocaleString()}`,
      stat2Label: "Employer Profit Sharing",
      stat2Val: `$${Math.round(employerMax).toLocaleString()}`,
      stat3Label: "SEP IRA Maximum",
      stat3Val: `$${Math.round(sepIraMax).toLocaleString()}`,
      color: "text-indigo-400",
    };
  }, [
    calcType,
    desiredNet,
    businessExpenses,
    healthInsurance,
    seTaxRate,
    incomeTaxRate,
    vacationWeeks,
    billableHoursPerWeek,
    w2Salary,
    w2Health,
    w2Match,
    w2PtoDays,
    contractorOverhead,
    standardHourly,
    committedHours,
    retainerDiscount,
    overageRate,
    invoiceAmount,
    annualLateRate,
    daysOverdue,
    flatLateFee,
    netSelfEmploymentProfit,
    age,
    businessStructure,
    w2WageSCorp,
    netProfitSCorp,
    reasonableSalarySCorp,
    adminOverheadSCorp,
    paypalAmount,
    paypalTier,
    paypalIsIntl,
    paypalIsReverse,
  ]);

  const handleCopy = useCallback(() => {
    const text = [
      `💼 ${currentToolData.name}:`,
      `---------------------------------`,
      `${results.heroLabel}: ${results.heroVal}`,
      `${results.stat1Label}: ${results.stat1Val}`,
      `${results.stat2Label}: ${results.stat2Val}`,
      `${results.stat3Label}: ${results.stat3Val}`,
      `---------------------------------`,
      `Formula: ${currentToolData.formulaExplanation}`,
    ].join("\n");

    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, [currentToolData, results]);

  const handleReset = useCallback(() => {
    setDesiredNet(85000);
    setBusinessExpenses(12000);
    setHealthInsurance(6000);
    setW2Salary(100000);
    setStandardHourly(150);
    setInvoiceAmount(6500);
    setNetSelfEmploymentProfit(120000);
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-medium uppercase tracking-wider mb-1.5">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Contractor & Freelance Financial Engine</span>
            <span className="text-slate-600">•</span>
            <span>100% Client-Side</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">{currentToolData.name}</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {currentToolData.shortDesc}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 self-start md:self-center">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Real-Time Rates</span>
        </div>
      </div>

      {/* Grid: Inputs vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        {/* Left Inputs Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-indigo-400" />
            <span>Parameters & Rates</span>
          </h3>

          {/* 1. Freelance Rate Inputs */}
          {calcType === "freelance-rate" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Desired Annual Take-Home Net ($)
                </label>
                <input
                  type="number"
                  value={desiredNet}
                  onChange={(e) => setDesiredNet(Math.max(1000, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2">
                {[50000, 75000, 100000, 150000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDesiredNet(amt)}
                    className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-all ${
                      desiredNet === amt
                        ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50"
                        : "bg-slate-800/60 text-slate-400 border-slate-700"
                    }`}
                  >
                    ${amt / 1000}k
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Annual Overhead ($)
                  </label>
                  <input
                    type="number"
                    value={businessExpenses}
                    onChange={(e) => setBusinessExpenses(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Health Insurance ($/yr)
                  </label>
                  <input
                    type="number"
                    value={healthInsurance}
                    onChange={(e) => setHealthInsurance(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Vacation Weeks ({vacationWeeks} wks)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={vacationWeeks}
                    onChange={(e) => setVacationWeeks(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Billable Hrs / Wk ({billableHoursPerWeek} hrs)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="40"
                    value={billableHoursPerWeek}
                    onChange={(e) => setBillableHoursPerWeek(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Self-Employment Tax ({seTaxRate}%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={seTaxRate}
                    onChange={(e) => setSeTaxRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Effective Income Tax ({incomeTaxRate}%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={incomeTaxRate}
                    onChange={(e) => setIncomeTaxRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. W2 vs 1099 Inputs */}
          {calcType === "w2-vs-1099" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  W-2 Base Annual Salary ($)
                </label>
                <input
                  type="number"
                  value={w2Salary}
                  onChange={(e) => setW2Salary(Math.max(1000, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Health Benefits ($/yr)
                  </label>
                  <input
                    type="number"
                    value={w2Health}
                    onChange={(e) => setW2Health(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    401(k) Match ($/yr)
                  </label>
                  <input
                    type="number"
                    value={w2Match}
                    onChange={(e) => setW2Match(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Contractor Overhead ($/yr)
                  </label>
                  <input
                    type="number"
                    value={contractorOverhead}
                    onChange={(e) => setContractorOverhead(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Paid Off Days ({w2PtoDays})
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    value={w2PtoDays}
                    onChange={(e) => setW2PtoDays(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. Retainer Pricing Inputs */}
          {calcType === "retainer-pricing" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Standard Hourly Rate ($)
                  </label>
                  <input
                    type="number"
                    value={standardHourly}
                    onChange={(e) => setStandardHourly(Math.max(10, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Committed Hours / Mo
                  </label>
                  <input
                    type="number"
                    value={committedHours}
                    onChange={(e) => setCommittedHours(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Discount ({retainerDiscount}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={retainerDiscount}
                    onChange={(e) => setRetainerDiscount(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Overage Hourly ($)
                  </label>
                  <input
                    type="number"
                    value={overageRate}
                    onChange={(e) => setOverageRate(Math.max(10, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. Late Invoice Inputs */}
          {calcType === "late-invoice-interest" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Overdue Invoice Principal ($)
                </label>
                <input
                  type="number"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:border-rose-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Days Overdue
                  </label>
                  <input
                    type="number"
                    value={daysOverdue}
                    onChange={(e) => setDaysOverdue(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-2.5 py-2 text-sm font-mono focus:border-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    APR (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={annualLateRate}
                    onChange={(e) => setAnnualLateRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-2.5 py-2 text-sm font-mono focus:border-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Late Fee ($)
                  </label>
                  <input
                    type="number"
                    value={flatLateFee}
                    onChange={(e) => setFlatLateFee(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-2.5 py-2 text-sm font-mono focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. Solo 401k vs SEP IRA Inputs */}
          {calcType === "sep-ira-solo-401k" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Net Business Earnings / Profit ($)
                </label>
                <input
                  type="number"
                  value={netSelfEmploymentProfit}
                  onChange={(e) => setNetSelfEmploymentProfit(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Business Entity
                  </label>
                  <select
                    value={businessStructure}
                    onChange={(e) => setBusinessStructure(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="sole_proprietor">Sole Prop / LLC</option>
                    <option value="s_corp">S-Corporation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Owner Age ({age})
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="70"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
              {businessStructure === "s_corp" && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    S-Corp Owner W-2 Wage ($)
                  </label>
                  <input
                    type="number"
                    value={w2WageSCorp}
                    onChange={(e) => setW2WageSCorp(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* 6. S-Corp Tax Savings Inputs */}
          {calcType === "s-corp-tax-savings" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Annual Net Business Operating Profit ($)
                </label>
                <input
                  type="number"
                  value={netProfitSCorp}
                  onChange={(e) => setNetProfitSCorp(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:border-emerald-500 focus:outline-none"
                />
                <div className="flex gap-2 mt-2">
                  {[60000, 100000, 150000, 200000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNetProfitSCorp(preset)}
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-emerald-400"
                    >
                      ${preset / 1000}k
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Reasonable W-2 Salary ($)
                  </label>
                  <input
                    type="number"
                    value={reasonableSalarySCorp}
                    onChange={(e) => setReasonableSalarySCorp(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Annual Admin Costs ($)
                  </label>
                  <input
                    type="number"
                    value={adminOverheadSCorp}
                    onChange={(e) => setAdminOverheadSCorp(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 7. PayPal Fee Inputs */}
          {calcType === "paypal-fee" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {paypalIsReverse ? "Target Net Cash Required ($)" : "Gross Charge / Sale Amount ($)"}
                </label>
                <input
                  type="number"
                  value={paypalAmount}
                  onChange={(e) => setPaypalAmount(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                />
                <div className="flex gap-2 mt-2">
                  {[25, 100, 500, 1200, 2500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPaypalAmount(preset)}
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-cyan-400"
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Transaction Type & Rate
                </label>
                <select
                  value={paypalTier}
                  onChange={(e) => setPaypalTier(e.target.value as "invoicing" | "checkout" | "qr")}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs font-mono focus:border-cyan-500 focus:outline-none"
                >
                  <option value="invoicing">PayPal Invoicing (3.49% + $0.49)</option>
                  <option value="checkout">PayPal Checkout / Button (2.99% + $0.49)</option>
                  <option value="qr">In-Person QR Code (&gt; $10: 1.90% + $0.10)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={paypalIsIntl}
                    onChange={(e) => setPaypalIsIntl(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span>Intl Card (+1.50%)</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={paypalIsReverse}
                    onChange={(e) => setPaypalIsReverse(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span>Reverse (Bill Client)</span>
                </label>
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
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                Optimal Target
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

          {/* Formula Explanation Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 text-xs space-y-2">
            <div className="font-semibold text-slate-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span>Mathematical Formula</span>
            </div>
            <p className="text-slate-400 font-mono text-[11px] bg-slate-950 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
              {currentToolData.formulaExplanation}
            </p>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 shadow-sm"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Breakdown</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all border border-slate-800"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                Print / PDF
              </button>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Inputs
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>100% private in-browser analysis. Your business metrics and rates never leave your device.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
