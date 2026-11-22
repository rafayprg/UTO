"use client";

import { useState, useMemo } from "react";
import { INVESTMENT_CRYPTO_TOOLS, type InvestmentCryptoToolData } from "@/data/programmatic/investments-crypto";
import type { ToolDefinition } from "@/lib/tools-registry";
import { TrendingUp, ShieldCheck, DollarSign, Sparkles, BarChart2 } from "lucide-react";

export default function InvestmentCryptoEngine({ tool }: { tool: ToolDefinition }) {
  const currentToolData: InvestmentCryptoToolData = useMemo(() => {
    return (
      INVESTMENT_CRYPTO_TOOLS.find((t) => t.slug === tool.slug) ||
      INVESTMENT_CRYPTO_TOOLS[0]
    );
  }, [tool.slug]);

  const calcType = currentToolData.calcType;

  // DCA States
  const [dcaAmount, setDcaAmount] = useState<number>(Number(currentToolData.defaultInputs.recurringAmount || 100));
  const [dcaFrequency, setDcaFrequency] = useState<string>("weekly");
  const [dcaMonths, setDcaMonths] = useState<number>(Number(currentToolData.defaultInputs.durationMonths || 24));
  const [dcaBtcPrice, setDcaBtcPrice] = useState<number>(Number(currentToolData.defaultInputs.startingBtcPrice || 65000));
  const [dcaGrowthRate, setDcaGrowthRate] = useState<number>(Number(currentToolData.defaultInputs.annualGrowthRate || 25));

  // Staking States
  const [stakedAmount, setStakedAmount] = useState<number>(Number(currentToolData.defaultInputs.ethAmount || 32));
  const [stakingApy, setStakingApy] = useState<number>(Number(currentToolData.defaultInputs.baseApy || 3.8));
  const [mevTipApy, setMevTipApy] = useState<number>(Number(currentToolData.defaultInputs.mevTipApy || 0.8));
  const [stakingYears, setStakingYears] = useState<number>(Number(currentToolData.defaultInputs.timeHorizonYears || 3));
  const [tokenPriceUsd, setTokenPriceUsd] = useState<number>(Number(currentToolData.defaultInputs.ethPriceUsd || 3400));

  // Crypto PnL States
  const [pnlInvestment, setPnlInvestment] = useState<number>(Number(currentToolData.defaultInputs.initialInvestment || 5000));
  const [pnlBuyPrice, setPnlBuyPrice] = useState<number>(Number(currentToolData.defaultInputs.buyPrice || 62000));
  const [pnlSellPrice, setPnlSellPrice] = useState<number>(Number(currentToolData.defaultInputs.sellPrice || 88000));
  const [pnlFeeRate, setPnlFeeRate] = useState<number>(Number(currentToolData.defaultInputs.exchangeFeeRate || 0.1));

  // Capital Gains States
  const [capGains, setCapGains] = useState<number>(Number(currentToolData.defaultInputs.totalGains || 25000));
  const [capHolding, setCapHolding] = useState<string>("long");
  const [capSalary, setCapSalary] = useState<number>(Number(currentToolData.defaultInputs.annualIncome || 95000));
  const [capStateRate, setCapStateRate] = useState<number>(Number(currentToolData.defaultInputs.stateTaxRate || 5.0));

  // Liquidation States
  const [liqPosition, setLiqPosition] = useState<string>("long");
  const [liqEntryPrice, setLiqEntryPrice] = useState<number>(Number(currentToolData.defaultInputs.entryPrice || 65000));
  const [liqLeverage, setLiqLeverage] = useState<number>(Number(currentToolData.defaultInputs.leverage || 10));

  // S&P 500 / DRIP / FIRE Common States
  const [spPrincipal, setSpPrincipal] = useState<number>(Number(currentToolData.defaultInputs.startingPrincipal || currentToolData.defaultInputs.initialInvestment || 10000));
  const [spMonthlyDeposit, setSpMonthlyDeposit] = useState<number>(Number(currentToolData.defaultInputs.monthlyDeposit || 500));
  const [spAnnualReturn, setSpAnnualReturn] = useState<number>(Number(currentToolData.defaultInputs.annualReturnRate || 10.0));
  const [spYears, setSpYears] = useState<number>(Number(currentToolData.defaultInputs.yearsToGrow || currentToolData.defaultInputs.investmentHorizonYears || 25));
  const [fireAnnualExpenses, setFireAnnualExpenses] = useState<number>(Number(currentToolData.defaultInputs.annualExpenses || 60000));
  const [fireSwr, setFireSwr] = useState<number>(Number(currentToolData.defaultInputs.safeWithdrawalRate || 4.0));

  // Active Calculations based on Tool Type
  const results = useMemo(() => {
    if (calcType === "dca") {
      const periodsPerMonth = dcaFrequency === "daily" ? 30 : dcaFrequency === "weekly" ? 4.33 : dcaFrequency === "biweekly" ? 2.16 : 1;
      const totalPurchases = Math.round(dcaMonths * periodsPerMonth);
      const totalInvested = totalPurchases * dcaAmount;
      const endPrice = dcaBtcPrice * Math.pow(1 + dcaGrowthRate / 100, dcaMonths / 12);
      const avgPurchasePrice = (dcaBtcPrice + endPrice) / 2;
      const totalBtcAccumulated = totalInvested / avgPurchasePrice;
      const endPortfolioValue = totalBtcAccumulated * endPrice;
      const netProfit = endPortfolioValue - totalInvested;
      const roiPercent = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;

      return {
        metric1Label: "Total Cash Invested",
        metric1Val: `$${totalInvested.toLocaleString()}`,
        metric2Label: "Total BTC Stacked",
        metric2Val: `${totalBtcAccumulated.toFixed(4)} BTC`,
        metric3Label: "Projected Portfolio Value",
        metric3Val: `$${Math.round(endPortfolioValue).toLocaleString()}`,
        metric4Label: "Total ROI",
        metric4Val: `+${roiPercent.toFixed(1)}%`,
        highlightColor: "text-amber-400",
      };
    }

    if (calcType === "staking") {
      const totalApy = stakingApy + mevTipApy;
      const annualRewards = stakedAmount * (totalApy / 100);
      const totalCompoundedTokens = stakedAmount * Math.pow(1 + totalApy / 100, stakingYears);
      const totalEarnedTokens = totalCompoundedTokens - stakedAmount;
      const annualUsdIncome = annualRewards * tokenPriceUsd;
      const totalUsdEarned = totalEarnedTokens * tokenPriceUsd;

      return {
        metric1Label: "Combined Annual APY",
        metric1Val: `${totalApy.toFixed(2)}%`,
        metric2Label: "Year 1 Rewards",
        metric2Val: `${annualRewards.toFixed(3)} Tokens`,
        metric3Label: "Annual USD Passive Yield",
        metric3Val: `$${Math.round(annualUsdIncome).toLocaleString()}/yr`,
        metric4Label: `${stakingYears}-Yr Total Rewards`,
        metric4Val: `$${Math.round(totalUsdEarned).toLocaleString()}`,
        highlightColor: "text-emerald-400",
      };
    }

    if (calcType === "crypto-pnl") {
      const buyFee = pnlInvestment * (pnlFeeRate / 100);
      const netInvested = pnlInvestment - buyFee;
      const unitsBought = pnlBuyPrice > 0 ? netInvested / pnlBuyPrice : 0;
      const grossExit = unitsBought * pnlSellPrice;
      const sellFee = grossExit * (pnlFeeRate / 100);
      const netExit = grossExit - sellFee;
      const netProfit = netExit - pnlInvestment;
      const roi = pnlInvestment > 0 ? (netProfit / pnlInvestment) * 100 : 0;

      return {
        metric1Label: "Total Trading Fees",
        metric1Val: `$${(buyFee + sellFee).toFixed(2)}`,
        metric2Label: "Gross Exit Proceeds",
        metric2Val: `$${Math.round(netExit).toLocaleString()}`,
        metric3Label: "Net Clean Profit",
        metric3Val: `${netProfit >= 0 ? "+" : ""}$${Math.round(netProfit).toLocaleString()}`,
        metric4Label: "Percentage Return",
        metric4Val: `${roi >= 0 ? "+" : ""}${roi.toFixed(2)}%`,
        highlightColor: netProfit >= 0 ? "text-emerald-400" : "text-rose-400",
      };
    }

    if (calcType === "crypto-tax" || calcType === "capital-gains") {
      let fedRate = 0.15;
      if (capHolding === "short") {
        fedRate = capSalary > 100000 ? 0.24 : 0.22;
      } else {
        fedRate = capSalary > 500000 ? 0.20 : capSalary > 47000 ? 0.15 : 0.0;
      }
      const fedTax = capGains * fedRate;
      const stateTax = capGains * (capStateRate / 100);
      const totalTax = fedTax + stateTax;
      const netTakeHome = capGains - totalTax;

      return {
        metric1Label: "Federal Capital Gains Tax",
        metric1Val: `$${Math.round(fedTax).toLocaleString()} (${(fedRate * 100).toFixed(0)}%)`,
        metric2Label: "State Tax Liability",
        metric2Val: `$${Math.round(stateTax).toLocaleString()} (${capStateRate}%)`,
        metric3Label: "Total Tax Owed",
        metric3Val: `$${Math.round(totalTax).toLocaleString()}`,
        metric4Label: "Net After-Tax Profit",
        metric4Val: `$${Math.round(netTakeHome).toLocaleString()}`,
        highlightColor: "text-blue-400",
      };
    }

    if (calcType === "liquidation") {
      const mm = 0.005; // 0.5% maintenance margin
      const liqLong = liqEntryPrice * (1 - 1 / liqLeverage + mm);
      const liqShort = liqEntryPrice * (1 + 1 / liqLeverage - mm);
      const targetLiq = liqPosition === "long" ? liqLong : liqShort;
      const distancePercent = ((Math.abs(targetLiq - liqEntryPrice)) / liqEntryPrice) * 100;

      return {
        metric1Label: "Entry Price",
        metric1Val: `$${liqEntryPrice.toLocaleString()}`,
        metric2Label: "Liquidation Price",
        metric2Val: `$${Math.round(targetLiq).toLocaleString()}`,
        metric3Label: "Buffer to Liquidation",
        metric3Val: `-${distancePercent.toFixed(2)}%`,
        metric4Label: "Max Leverage Multiplier",
        metric4Val: `${liqLeverage}x Isolated`,
        highlightColor: "text-rose-400",
      };
    }

    if (calcType === "fire") {
      const targetFireNumber = fireAnnualExpenses / (fireSwr / 100);
      const monthlySafeBudget = fireAnnualExpenses / 12;

      return {
        metric1Label: "Target FIRE Portfolio",
        metric1Val: `$${Math.round(targetFireNumber).toLocaleString()}`,
        metric2Label: "Safe Monthly Income",
        metric2Val: `$${Math.round(monthlySafeBudget).toLocaleString()}/mo`,
        metric3Label: "Safe Withdrawal Rate",
        metric3Val: `${fireSwr}% Annual SWR`,
        metric4Label: "Annual Living Expense",
        metric4Val: `$${fireAnnualExpenses.toLocaleString()}/yr`,
        highlightColor: "text-emerald-400",
      };
    }

    // Default S&P 500 / DRIP / Compound
    const r = spAnnualReturn / 100;
    const n = 12;
    const t = spYears;
    const fvPrincipal = spPrincipal * Math.pow(1 + r / n, n * t);
    const fvDeposits = spMonthlyDeposit * ((Math.pow(1 + r / n, n * t) - 1) / (r / n));
    const totalFutureValue = fvPrincipal + fvDeposits;
    const totalContributed = spPrincipal + spMonthlyDeposit * 12 * t;
    const totalGrowth = totalFutureValue - totalContributed;

    return {
      metric1Label: "Total Principal Contributed",
      metric1Val: `$${Math.round(totalContributed).toLocaleString()}`,
      metric2Label: "Compound Interest Earned",
      metric2Val: `+$${Math.round(totalGrowth).toLocaleString()}`,
      metric3Label: "Final Portfolio Balance",
      metric3Val: `$${Math.round(totalFutureValue).toLocaleString()}`,
      metric4Label: "Annualized Growth Rate",
      metric4Val: `${spAnnualReturn}% / year`,
      highlightColor: "text-emerald-400",
    };
  }, [
    calcType,
    dcaAmount,
    dcaFrequency,
    dcaMonths,
    dcaBtcPrice,
    dcaGrowthRate,
    stakedAmount,
    stakingApy,
    mevTipApy,
    stakingYears,
    tokenPriceUsd,
    pnlInvestment,
    pnlBuyPrice,
    pnlSellPrice,
    pnlFeeRate,
    capGains,
    capHolding,
    capSalary,
    capStateRate,
    liqPosition,
    liqEntryPrice,
    liqLeverage,
    fireAnnualExpenses,
    fireSwr,
    spPrincipal,
    spMonthlyDeposit,
    spAnnualReturn,
    spYears,
  ]);

  return (
    <div className="space-y-6">
      {/* Engine Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-medium tracking-wide uppercase mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Wealth & Quantitative Simulation Engine</span>
            <span className="text-slate-600">•</span>
            <span>Mathematical Accuracy</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">{currentToolData.name}</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">{currentToolData.shortDesc}</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Deterministic Browser Math</span>
        </div>
      </div>

      {/* Grid: Inputs and Result Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Column */}
        <div className="lg:col-span-5 space-y-4 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-cyan-400" />
            <span>Investment Parameters</span>
          </h3>

          {/* DCA Inputs */}
          {calcType === "dca" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Recurring Buy Amount ($)</label>
                <input
                  type="number"
                  value={dcaAmount}
                  onChange={(e) => setDcaAmount(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Buy Frequency</label>
                <div className="grid grid-cols-3 gap-2">
                  {["daily", "weekly", "monthly"].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setDcaFrequency(f)}
                      className={`text-xs py-1.5 rounded capitalize border ${
                        dcaFrequency === f
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Duration: <span className="text-cyan-400 font-mono">{dcaMonths} Months</span>
                </label>
                <input
                  type="range"
                  min="6"
                  max="60"
                  step="6"
                  value={dcaMonths}
                  onChange={(e) => setDcaMonths(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Asset Starting Price ($)</label>
                  <input
                    type="number"
                    value={dcaBtcPrice}
                    onChange={(e) => setDcaBtcPrice(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Expected Annual Gain (%)</label>
                  <input
                    type="number"
                    value={dcaGrowthRate}
                    onChange={(e) => setDcaGrowthRate(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Crypto PnL Inputs */}
          {calcType === "crypto-pnl" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Initial Capital ($)</label>
                <input
                  type="number"
                  value={pnlInvestment}
                  onChange={(e) => setPnlInvestment(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Buy Price ($)</label>
                  <input
                    type="number"
                    value={pnlBuyPrice}
                    onChange={(e) => setPnlBuyPrice(Math.max(0.0001, Number(e.target.value)))}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Exit Price ($)</label>
                  <input
                    type="number"
                    value={pnlSellPrice}
                    onChange={(e) => setPnlSellPrice(Math.max(0.0001, Number(e.target.value)))}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Exchange Fee Rate (% per trade)</label>
                <input
                  type="number"
                  step="0.05"
                  value={pnlFeeRate}
                  onChange={(e) => setPnlFeeRate(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Staking Inputs */}
          {calcType === "staking" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tokens Staked</label>
                <input
                  type="number"
                  value={stakedAmount}
                  onChange={(e) => setStakedAmount(Math.max(0.1, Number(e.target.value)))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Protocol APY (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={stakingApy}
                    onChange={(e) => setStakingApy(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Token USD Price</label>
                  <input
                    type="number"
                    value={tokenPriceUsd}
                    onChange={(e) => setTokenPriceUsd(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">MEV & Tip APY (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={mevTipApy}
                    onChange={(e) => setMevTipApy(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Staking Horizon (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={stakingYears}
                    onChange={(e) => setStakingYears(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Capital Gains & Crypto Tax Inputs */}
          {(calcType === "crypto-tax" || calcType === "capital-gains") && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Total Net Gain ($)</label>
                <input
                  type="number"
                  value={capGains}
                  onChange={(e) => setCapGains(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Holding Period</label>
                  <select
                    value={capHolding}
                    onChange={(e) => setCapHolding(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="long">Long-Term (&gt; 1 Yr)</option>
                    <option value="short">Short-Term (&le; 1 Yr)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">State Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={capStateRate}
                    onChange={(e) => setCapStateRate(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Annual Ordinary Income ($)</label>
                <input
                  type="number"
                  value={capSalary}
                  onChange={(e) => setCapSalary(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Liquidation Inputs */}
          {calcType === "liquidation" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Position Type</label>
                  <select
                    value={liqPosition}
                    onChange={(e) => setLiqPosition(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="long">Long (Buy)</option>
                    <option value="short">Short (Sell)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Leverage ({liqLeverage}x)</label>
                  <input
                    type="range"
                    min="2"
                    max="100"
                    value={liqLeverage}
                    onChange={(e) => setLiqLeverage(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Entry Price ($)</label>
                <input
                  type="number"
                  value={liqEntryPrice}
                  onChange={(e) => setLiqEntryPrice(Math.max(0.01, Number(e.target.value)))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* FIRE Inputs */}
          {calcType === "fire" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Annual Living Expenses ($)</label>
                <input
                  type="number"
                  value={fireAnnualExpenses}
                  onChange={(e) => setFireAnnualExpenses(Math.max(1000, Number(e.target.value)))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Safe Withdrawal Rate: <span className="text-cyan-400 font-mono">{fireSwr}%</span>
                </label>
                <input
                  type="range"
                  min="2.5"
                  max="6.0"
                  step="0.1"
                  value={fireSwr}
                  onChange={(e) => setFireSwr(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>
          )}

          {/* S&P 500 / DRIP / Compound Inputs */}
          {(calcType === "sp500-growth" || calcType === "drip") && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Initial Starting Capital ($)</label>
                <input
                  type="number"
                  value={spPrincipal}
                  onChange={(e) => setSpPrincipal(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Monthly Recurring Contribution ($)</label>
                <input
                  type="number"
                  value={spMonthlyDeposit}
                  onChange={(e) => setSpMonthlyDeposit(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Annual Return (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={spAnnualReturn}
                    onChange={(e) => setSpAnnualReturn(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Horizon ({spYears} Yrs)</label>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    value={spYears}
                    onChange={(e) => setSpYears(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Output Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-6 relative overflow-hidden">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400 block mb-1">
              Projected Output
            </span>
            <div className={`text-3xl md:text-4xl font-extrabold font-mono ${results.highlightColor}`}>
              {results.metric3Val}
            </div>
            <div className="text-xs text-slate-400 mt-1">{results.metric3Label}</div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800">
              <div>
                <span className="text-xs text-slate-400 block">{results.metric1Label}</span>
                <span className="text-base font-bold font-mono text-slate-100">{results.metric1Val}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">{results.metric2Label}</span>
                <span className="text-base font-bold font-mono text-slate-100">{results.metric2Val}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">{results.metric4Label}</span>
                <span className="text-base font-bold font-mono text-cyan-400">{results.metric4Val}</span>
              </div>
            </div>
          </div>

          {/* Mathematical Formula Footnote */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-1.5">
            <div className="font-semibold text-slate-200 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              <span>Underlying Financial Formula</span>
            </div>
            <p className="text-slate-400 font-mono text-[11px] bg-slate-950 p-2.5 rounded border border-slate-800/80">
              {currentToolData.formulaExplanation}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Zero server requests. All simulations and projections execute strictly in your local browser sandbox.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
