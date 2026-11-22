"use client";

import { useState, useMemo } from "react";
import { GROWTH_ECOMMERCE_TOOLS, type GrowthEcommerceToolData } from "@/data/programmatic/growth-ecommerce";
import type { ToolDefinition } from "@/lib/tools-registry";
import { ShoppingCart, ShieldCheck, DollarSign, BarChart3, Sparkles } from "lucide-react";

export default function GrowthEcommerceEngine({ tool }: { tool: ToolDefinition }) {
  const currentToolData: GrowthEcommerceToolData = useMemo(() => {
    return (
      GROWTH_ECOMMERCE_TOOLS.find((t) => t.slug === tool.slug) ||
      GROWTH_ECOMMERCE_TOOLS[0]
    );
  }, [tool.slug]);

  const calcType = currentToolData.calcType;

  // ROAS & Target CPA States
  const [sellingPrice, setSellingPrice] = useState<number>(Number(currentToolData.defaultInputs.sellingPrice || currentToolData.defaultInputs.averageOrderValue || 100));
  const [cogs, setCogs] = useState<number>(Number(currentToolData.defaultInputs.cogs || currentToolData.defaultInputs.costPerUnit || 30));
  const [shippingCost, setShippingCost] = useState<number>(Number(currentToolData.defaultInputs.shippingAndFulfillment || currentToolData.defaultInputs.shippingCost || 10));
  const [merchantFeePercent, setMerchantFeePercent] = useState<number>(Number(currentToolData.defaultInputs.paymentProcessingFeePercent || 3.0));
  const [targetProfitPercent, setTargetProfitPercent] = useState<number>(Number(currentToolData.defaultInputs.targetProfitMargin || 15));

  // CAC States
  const [adSpend, setAdSpend] = useState<number>(Number(currentToolData.defaultInputs.totalAdSpend || 45000));
  const [marketingOverhead, setMarketingOverhead] = useState<number>(Number((Number(currentToolData.defaultInputs.agencyAndToolCosts || 0) + Number(currentToolData.defaultInputs.marketingSalaries || 0)) || 23000));
  const [paidCustomers, setPaidCustomers] = useState<number>(Number(currentToolData.defaultInputs.newCustomersFromPaidAds || 900));
  const [organicCustomers, setOrganicCustomers] = useState<number>(Number(currentToolData.defaultInputs.newCustomersFromOrganic || 600));

  // LTV & SaaS States
  const [aov, setAov] = useState<number>(Number(currentToolData.defaultInputs.averageOrderValue || 70));
  const [purchaseFrequency, setPurchaseFrequency] = useState<number>(Number(currentToolData.defaultInputs.purchaseFrequencyPerYear || 3.5));
  const [lifespanYears, setLifespanYears] = useState<number>(Number(currentToolData.defaultInputs.customerLifespanYears || 3));
  const [grossMarginPct, setGrossMarginPct] = useState<number>(Number(currentToolData.defaultInputs.grossMarginPercent || 65));

  // Shopify & TikTok Specific States
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(Number(currentToolData.defaultInputs.monthlyRevenue || 35000));
  const [appCosts, setAppCosts] = useState<number>(Number(currentToolData.defaultInputs.shopifyAppSubscriptions || 350));
  const [creatorCommissionPct, setCreatorCommissionPct] = useState<number>(Number(currentToolData.defaultInputs.affiliateCommissionPercent || 15.0));

  // Amazon PPC States
  const [ppcSpend, setPpcSpend] = useState<number>(Number(currentToolData.defaultInputs.ppcAdSpend || 4200));
  const [ppcSales, setPpcSales] = useState<number>(Number(currentToolData.defaultInputs.ppcAdSales || 16800));
  const [totalStoreSales, setTotalStoreSales] = useState<number>(Number(currentToolData.defaultInputs.totalStoreSales || 48000));

  // Calculation Engine
  const metrics = useMemo(() => {
    if (calcType === "roas-breakeven") {
      const merchantFee = sellingPrice * (merchantFeePercent / 100);
      const contributionMarginDollars = sellingPrice - cogs - shippingCost - merchantFee;
      const contributionMarginPercent = sellingPrice > 0 ? (contributionMarginDollars / sellingPrice) * 100 : 0;
      const breakevenRoas = contributionMarginPercent > 0 ? 100 / contributionMarginPercent : 0;
      const targetMarginDollars = sellingPrice * (targetProfitPercent / 100);
      const allowableAdCost = Math.max(0, contributionMarginDollars - targetMarginDollars);
      const targetRoas = allowableAdCost > 0 ? sellingPrice / allowableAdCost : 0;

      return {
        heroLabel: "Minimum Breakeven ROAS",
        heroVal: `${breakevenRoas.toFixed(2)}x (${(breakevenRoas * 100).toFixed(0)}%)`,
        heroSub: `Requires $${(sellingPrice / (breakevenRoas || 1)).toFixed(2)} max ad spend per order`,
        stat1Label: "Contribution Margin",
        stat1Val: `$${contributionMarginDollars.toFixed(2)} (${contributionMarginPercent.toFixed(1)}%)`,
        stat2Label: "Target ROAS for Profit",
        stat2Val: `${targetRoas.toFixed(2)}x (${(targetRoas * 100).toFixed(0)}%)`,
        stat3Label: "Allowable Ad Spend (CPA)",
        stat3Val: `$${allowableAdCost.toFixed(2)} / sale`,
        color: "text-emerald-400",
      };
    }

    if (calcType === "blended-cac") {
      const paidCac = paidCustomers > 0 ? adSpend / paidCustomers : 0;
      const totalAcquisitionSpend = adSpend + marketingOverhead;
      const totalCustomers = paidCustomers + organicCustomers;
      const blendedCac = totalCustomers > 0 ? totalAcquisitionSpend / totalCustomers : 0;
      const organicShare = totalCustomers > 0 ? (organicCustomers / totalCustomers) * 100 : 0;

      return {
        heroLabel: "Blended Customer Acquisition Cost (CAC)",
        heroVal: `$${blendedCac.toFixed(2)}`,
        heroSub: `Across all ${totalCustomers.toLocaleString()} customers (Paid + Organic)`,
        stat1Label: "Paid Ad Only CAC",
        stat1Val: `$${paidCac.toFixed(2)}`,
        stat2Label: "Organic Flywheel Share",
        stat2Val: `${organicShare.toFixed(1)}% of total`,
        stat3Label: "Total Marketing Budget",
        stat3Val: `$${totalAcquisitionSpend.toLocaleString()}`,
        color: "text-indigo-400",
      };
    }

    if (calcType === "ltv" || calcType === "ltv-cac-ratio") {
      const annualCustomerValue = aov * purchaseFrequency;
      const grossLifetimeRevenue = annualCustomerValue * lifespanYears;
      const marginAdjustedLtv = grossLifetimeRevenue * (grossMarginPct / 100);

      return {
        heroLabel: "Margin-Adjusted Net LTV",
        heroVal: `$${marginAdjustedLtv.toFixed(2)}`,
        heroSub: `Gross Customer Value: $${grossLifetimeRevenue.toFixed(2)} over ${lifespanYears} years`,
        stat1Label: "Annual Gross Spend",
        stat1Val: `$${annualCustomerValue.toFixed(2)}/yr`,
        stat2Label: "Gross Margin %",
        stat2Val: `${grossMarginPct}%`,
        stat3Label: "3:1 Allowable CAC Target",
        stat3Val: `$${(marginAdjustedLtv / 3).toFixed(2)}`,
        color: "text-emerald-400",
      };
    }

    if (calcType === "shopify-margin") {
      const gatewayFee = monthlyRevenue * 0.027 + 420 * 0.3; // avg 420 orders
      const totalOverhead = cogs + adSpend + appCosts + 105 + gatewayFee;
      const netProfit = monthlyRevenue - totalOverhead;
      const netMargin = monthlyRevenue > 0 ? (netProfit / monthlyRevenue) * 100 : 0;

      return {
        heroLabel: "Net Take-Home Store Profit",
        heroVal: `$${Math.round(netProfit).toLocaleString()}`,
        heroSub: `${netMargin.toFixed(1)}% Net Margin after Apps, Gateway & Ads`,
        stat1Label: "Shopify Gateway Cut",
        stat1Val: `$${Math.round(gatewayFee).toLocaleString()}`,
        stat2Label: "Product COGS",
        stat2Val: `$${cogs.toLocaleString()}`,
        stat3Label: "Monthly Ad Spend",
        stat3Val: `$${adSpend.toLocaleString()}`,
        color: "text-emerald-400",
      };
    }

    if (calcType === "tiktok-shop") {
      const referralFee = sellingPrice * 0.06;
      const affiliateFee = sellingPrice * (creatorCommissionPct / 100);
      const totalPlatformFees = referralFee + affiliateFee;
      const netPayout = sellingPrice - totalPlatformFees - shippingCost;
      const netProfit = netPayout - cogs;
      const profitMargin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;

      return {
        heroLabel: "Net Seller Profit Per Unit",
        heroVal: `$${netProfit.toFixed(2)}`,
        heroSub: `${profitMargin.toFixed(1)}% clean net margin on $${sellingPrice} retail`,
        stat1Label: "TikTok 6% Referral",
        stat1Val: `$${referralFee.toFixed(2)}`,
        stat2Label: "Creator Commission",
        stat2Val: `$${affiliateFee.toFixed(2)} (${creatorCommissionPct}%)`,
        stat3Label: "Total Deduction Cut",
        stat3Val: `$${(totalPlatformFees + shippingCost).toFixed(2)}`,
        color: "text-cyan-400",
      };
    }

    if (calcType === "amazon-acos") {
      const acos = ppcSales > 0 ? (ppcSpend / ppcSales) * 100 : 0;
      const tacos = totalStoreSales > 0 ? (ppcSpend / totalStoreSales) * 100 : 0;
      const organicHaloMultiplier = ppcSales > 0 ? totalStoreSales / ppcSales : 1;

      return {
        heroLabel: "Total Advertising Cost (TACoS)",
        heroVal: `${tacos.toFixed(2)}%`,
        heroSub: `PPC ACoS: ${acos.toFixed(1)}% on $${ppcSales.toLocaleString()} ad sales`,
        stat1Label: "Organic Halo Lift",
        stat1Val: `${organicHaloMultiplier.toFixed(2)}x total lift`,
        stat2Label: "Monthly PPC Spend",
        stat2Val: `$${ppcSpend.toLocaleString()}`,
        stat3Label: "Total Store Sales",
        stat3Val: `$${totalStoreSales.toLocaleString()}`,
        color: tacos <= 12 ? "text-emerald-400" : "text-amber-400",
      };
    }

    // Default Target CPA
    const maxCpa = Math.max(0, sellingPrice - cogs - shippingCost - 5);
    return {
      heroLabel: "Target Allowable CPA",
      heroVal: `$${maxCpa.toFixed(2)}`,
      heroSub: `Maximum profitable cost per customer acquisition`,
      stat1Label: "Unit Retail Price",
      stat1Val: `$${sellingPrice.toFixed(2)}`,
      stat2Label: "Total Unit Cost (COGS+Ship)",
      stat2Val: `$${(cogs + shippingCost).toFixed(2)}`,
      stat3Label: "Breakeven Multiplier",
      stat3Val: `${(sellingPrice / (maxCpa || 1)).toFixed(2)}x`,
      color: "text-emerald-400",
    };
  }, [
    calcType,
    sellingPrice,
    cogs,
    shippingCost,
    merchantFeePercent,
    targetProfitPercent,
    adSpend,
    marketingOverhead,
    paidCustomers,
    organicCustomers,
    aov,
    purchaseFrequency,
    lifespanYears,
    grossMarginPct,
    monthlyRevenue,
    appCosts,
    creatorCommissionPct,
    ppcSpend,
    ppcSales,
    totalStoreSales,
  ]);

  return (
    <div className="space-y-6">
      {/* Engine Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-medium tracking-wide uppercase mb-1">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Growth Marketing & Unit Economics Engine</span>
            <span className="text-slate-600">•</span>
            <span>Client-Side Speed</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">{currentToolData.name}</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">{currentToolData.shortDesc}</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Real-Time Ad Economics</span>
        </div>
      </div>

      {/* Grid: Inputs vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Column */}
        <div className="lg:col-span-5 space-y-4 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-indigo-400" />
            <span>Financial & Campaign Inputs</span>
          </h3>

          {/* ROAS & CPA Inputs */}
          {(calcType === "roas-breakeven" || calcType === "target-cpa") && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Selling Price ($)</label>
                <input
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Product COGS ($)</label>
                  <input
                    type="number"
                    value={cogs}
                    onChange={(e) => setCogs(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Shipping & Pick/Pack ($)</label>
                  <input
                    type="number"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Profit Margin: <span className="text-indigo-400 font-mono">{targetProfitPercent}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={targetProfitPercent}
                  onChange={(e) => setTargetProfitPercent(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Payment Processing Fee: <span className="text-indigo-400 font-mono">{merchantFeePercent}%</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="6"
                  step="0.1"
                  value={merchantFeePercent}
                  onChange={(e) => setMerchantFeePercent(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Blended CAC Inputs */}
          {calcType === "blended-cac" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Total Paid Ad Spend ($)</label>
                <input
                  type="number"
                  value={adSpend}
                  onChange={(e) => setAdSpend(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Marketing Agency & Salary Overhead ($)</label>
                <input
                  type="number"
                  value={marketingOverhead}
                  onChange={(e) => setMarketingOverhead(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">New Paid Customers</label>
                  <input
                    type="number"
                    value={paidCustomers}
                    onChange={(e) => setPaidCustomers(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">New Organic Customers</label>
                  <input
                    type="number"
                    value={organicCustomers}
                    onChange={(e) => setOrganicCustomers(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* LTV & CLV Inputs */}
          {(calcType === "ltv" || calcType === "ltv-cac-ratio") && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Average Order Value (AOV) ($)</label>
                <input
                  type="number"
                  value={aov}
                  onChange={(e) => setAov(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Orders / Year</label>
                  <input
                    type="number"
                    step="0.1"
                    value={purchaseFrequency}
                    onChange={(e) => setPurchaseFrequency(Math.max(0.1, Number(e.target.value)))}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Lifespan (Years)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={lifespanYears}
                    onChange={(e) => setLifespanYears(Math.max(0.5, Number(e.target.value)))}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Gross Margin: <span className="text-indigo-400 font-mono">{grossMarginPct}%</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="95"
                  value={grossMarginPct}
                  onChange={(e) => setGrossMarginPct(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Shopify Margin Inputs */}
          {calcType === "shopify-margin" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Monthly Gross Revenue ($)</label>
                <input
                  type="number"
                  value={monthlyRevenue}
                  onChange={(e) => setMonthlyRevenue(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Inventory COGS ($)</label>
                  <input
                    type="number"
                    value={cogs}
                    onChange={(e) => setCogs(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Monthly Ad Spend ($)</label>
                  <input
                    type="number"
                    value={adSpend}
                    onChange={(e) => setAdSpend(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Shopify App Subscriptions ($/mo)</label>
                <input
                  type="number"
                  value={appCosts}
                  onChange={(e) => setAppCosts(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Amazon PPC Inputs */}
          {calcType === "amazon-acos" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">PPC Ad Spend ($)</label>
                <input
                  type="number"
                  value={ppcSpend}
                  onChange={(e) => setPpcSpend(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">PPC Attributed Sales ($)</label>
                <input
                  type="number"
                  value={ppcSales}
                  onChange={(e) => setPpcSales(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Total Store Sales (PPC + Organic) ($)</label>
                <input
                  type="number"
                  value={totalStoreSales}
                  onChange={(e) => setTotalStoreSales(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TikTok Shop Inputs */}
          {calcType === "tiktok-shop" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Retail Price ($)</label>
                <input
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Unit COGS ($)</label>
                  <input
                    type="number"
                    value={cogs}
                    onChange={(e) => setCogs(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Shipping Cost ($)</label>
                  <input
                    type="number"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Creator Affiliate Commission: <span className="text-indigo-400 font-mono">{creatorCommissionPct}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={creatorCommissionPct}
                  onChange={(e) => setCreatorCommissionPct(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Output Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-6 relative overflow-hidden">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400 block mb-1">
              {metrics.heroLabel}
            </span>
            <div className={`text-3xl md:text-4xl font-extrabold font-mono ${metrics.color}`}>
              {metrics.heroVal}
            </div>
            <div className="text-xs text-slate-400 mt-1">{metrics.heroSub}</div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800">
              <div>
                <span className="text-xs text-slate-400 block">{metrics.stat1Label}</span>
                <span className="text-base font-bold font-mono text-slate-100">{metrics.stat1Val}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">{metrics.stat2Label}</span>
                <span className="text-base font-bold font-mono text-slate-100">{metrics.stat2Val}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">{metrics.stat3Label}</span>
                <span className="text-base font-bold font-mono text-indigo-400">{metrics.stat3Val}</span>
              </div>
            </div>
          </div>

          {/* Formula Explanation */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-1.5">
            <div className="font-semibold text-slate-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span>Unit Economics Formula</span>
            </div>
            <p className="text-slate-400 font-mono text-[11px] bg-slate-950 p-2.5 rounded border border-slate-800/80">
              {currentToolData.formulaExplanation}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>100% private in-browser analysis. Your business metrics and margins are never logged or transmitted.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
