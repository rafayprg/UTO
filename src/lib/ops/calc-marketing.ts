import type { CalcOp } from "./types";
import { extendedFinanceOps } from "./calc-finance-extended.ts";

function num(value: string, label: string, { min = -Infinity, max = Infinity, allowZero = true } = {}): number {
  const parsed = Number(String(value).replace(/,/g, "").trim());
  if (value.trim() === "" || !Number.isFinite(parsed)) throw new Error(`Enter a number for ${label}.`);
  if (parsed < min || parsed > max || (!allowZero && parsed === 0)) throw new Error(`${label} must be ${allowZero ? "at least" : "greater than"} ${min}.`);
  return parsed;
}

const usd = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD" });
const pct = (v: number) => `${v.toFixed(2)}%`;

export const ops: Record<string, CalcOp> = {
  // Existing extended ops
  "cost-per-click-calculator": extendedFinanceOps["cost-per-click-calculator"],
  "cost-per-acquisition-calculator": extendedFinanceOps["cost-per-acquisition-calculator"],
  "email-campaign-roi-calculator": extendedFinanceOps["email-campaign-roi-calculator"],

  "google-ads-roas": {
    fields: [
      { id: "adSpend", label: "Google Ads Total Spend ($)", type: "number", default: "5000" },
      { id: "revenue", label: "Ad-Attributed Sales Revenue ($)", type: "number", default: "22000" },
      { id: "targetRoas", label: "Target ROAS (%) (Optional)", type: "number", default: "400", step: "10" }
    ],
    note: "Calculates Return on Ad Spend (ROAS) and compares against your target bid strategy.",
    compute(v) {
      const spend = num(v.adSpend, "Ad Spend", { min: 1, allowZero: false });
      const rev = num(v.revenue, "Revenue", { min: 0 });
      const tgt = num(v.targetRoas, "Target ROAS", { min: 0 }) / 100;
      const roas = rev / spend;
      const profit = rev - spend;
      return {
        results: [
          { label: "ROAS (Return on Ad Spend)", value: `${(roas * 100).toFixed(1)}% (${roas.toFixed(2)}x)`, primary: true },
          { label: "Net Profit Generated", value: usd(profit) },
          { label: "Performance vs Target", value: roas >= tgt ? `Exceeds Target (≥${pct(tgt * 100)})` : `Below Target (<${pct(tgt * 100)})` }
        ],
        formula: "ROAS = (Revenue / Ad Spend) × 100"
      };
    }
  },

  "meta-ads-cpl": {
    fields: [
      { id: "adSpend", label: "Total Meta/Facebook Ad Spend ($)", type: "number", default: "3500" },
      { id: "leads", label: "Leads Generated", type: "number", default: "140" },
      { id: "targetCpl", label: "Target Cost Per Lead ($)", type: "number", default: "30" }
    ],
    note: "Evaluates Meta Lead Generation campaigns against unit economics targets.",
    compute(v) {
      const spend = num(v.adSpend, "Ad Spend", { min: 1, allowZero: false });
      const leads = num(v.leads, "Leads", { min: 1, allowZero: false });
      const tgt = num(v.targetCpl, "Target CPL", { min: 0 });
      const cpl = spend / leads;
      return {
        results: [
          { label: "Cost Per Lead (CPL)", value: usd(cpl), primary: true },
          { label: "Variance vs Target", value: cpl <= tgt ? `Efficient (-${usd(tgt - cpl)} below target)` : `Over Budget (+${usd(cpl - tgt)} over target)` }
        ],
        formula: "CPL = Total Ad Spend / Leads Generated"
      };
    }
  },

  "influencer-marketing-roi": {
    fields: [
      { id: "influencerFee", label: "Influencer Fee ($)", type: "number", default: "4000" },
      { id: "productGiftingCost", label: "Product & Shipping Gifting Cost ($)", type: "number", default: "500" },
      { id: "campaignRevenue", label: "Tracked Sales Revenue (Promo code/link) ($)", type: "number", default: "16500" },
      { id: "cogsPercent", label: "Product COGS Margin (%)", type: "number", default: "30", step: "1" }
    ],
    note: "Measures true net profit ROI from influencer collaborations taking into account product fulfillment costs.",
    compute(v) {
      const fee = num(v.influencerFee, "Fee", { min: 0 });
      const gift = num(v.productGiftingCost, "Gifting", { min: 0 });
      const rev = num(v.campaignRevenue, "Revenue", { min: 0 });
      const cogsRate = num(v.cogsPercent, "COGS %", { min: 0, max: 99 }) / 100;
      const totalCost = fee + gift;
      const grossProfit = rev * (1 - cogsRate);
      const netProfit = grossProfit - totalCost;
      const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
      return {
        results: [
          { label: "Influencer Campaign ROI", value: pct(roi), primary: true },
          { label: "Net Campaign Profit", value: usd(netProfit) },
          { label: "Gross Revenue Generated", value: usd(rev) },
          { label: "Total Campaign Cost", value: usd(totalCost) }
        ],
        formula: "ROI = [(Revenue × (1 - COGS%)) - Campaign Cost] / Campaign Cost"
      };
    }
  },

  "affiliate-commission-calculator": {
    fields: [
      { id: "totalSales", label: "Total Referred Sales ($)", type: "number", default: "25000" },
      { id: "commissionRate", label: "Affiliate Commission Rate (%)", type: "number", default: "15", step: "0.5" },
      { id: "networkFeeRate", label: "Affiliate Network Fee (%)", type: "number", default: "3", step: "0.5" }
    ],
    note: "Calculates affiliate payouts, platform/network processing fees, and merchant net revenue.",
    compute(v) {
      const sales = num(v.totalSales, "Total Sales", { min: 0 });
      const commRate = num(v.commissionRate, "Commission %", { min: 0 }) / 100;
      const feeRate = num(v.networkFeeRate, "Network Fee %", { min: 0 }) / 100;
      const commissionPayout = sales * commRate;
      const networkFee = sales * feeRate;
      const netMerchantRevenue = sales - commissionPayout - networkFee;
      return {
        results: [
          { label: "Affiliate Commission Payout", value: usd(commissionPayout), primary: true },
          { label: "Merchant Net Revenue", value: usd(netMerchantRevenue) },
          { label: "Network Management Fee", value: usd(networkFee) }
        ],
        formula: "Commission = Total Sales × Commission Rate %"
      };
    }
  },

  "email-ctr-calculator": {
    fields: [
      { id: "sent", label: "Emails Sent", type: "number", default: "50000" },
      { id: "bounces", label: "Bounced Emails", type: "number", default: "750" },
      { id: "uniqueOpens", label: "Unique Opens", type: "number", default: "12500" },
      { id: "uniqueClicks", label: "Unique Clicks", type: "number", default: "2100" }
    ],
    note: "Industry email performance metrics: Delivery Rate, Open Rate, and Click-Through Rate (CTR).",
    compute(v) {
      const sent = num(v.sent, "Sent", { min: 1, allowZero: false });
      const bounces = num(v.bounces, "Bounces", { min: 0 });
      const opens = num(v.uniqueOpens, "Opens", { min: 0 });
      const clicks = num(v.uniqueClicks, "Clicks", { min: 0 });
      const delivered = Math.max(1, sent - bounces);
      const deliveryRate = (delivered / sent) * 100;
      const openRate = (opens / delivered) * 100;
      const ctr = (clicks / delivered) * 100;
      const ctor = opens > 0 ? (clicks / opens) * 100 : 0;
      return {
        results: [
          { label: "Click-Through Rate (CTR)", value: pct(ctr), primary: true },
          { label: "Open Rate", value: pct(openRate) },
          { label: "Click-To-Open Rate (CTOR)", value: pct(ctor) },
          { label: "Delivery Rate", value: pct(deliveryRate) }
        ],
        formula: "CTR = (Clicks / Delivered) × 100 | Open Rate = (Opens / Delivered) × 100"
      };
    }
  },

  "video-completion-rate": {
    fields: [
      { id: "videoStarts", label: "Total Video Starts / Impressions", type: "number", default: "75000" },
      { id: "videoCompletes", label: "Completed Video Views (100% watched)", type: "number", default: "38500" }
    ],
    note: "Video Completion Rate (VCR) is the primary metric for video ad engagement and algorithmic ranking.",
    compute(v) {
      const starts = num(v.videoStarts, "Video Starts", { min: 1, allowZero: false });
      const completes = num(v.videoCompletes, "Video Completes", { min: 0 });
      if (completes > starts) throw new Error("Completes cannot exceed starts.");
      const vcr = (completes / starts) * 100;
      return {
        results: [
          { label: "Video Completion Rate (VCR)", value: pct(vcr), primary: true },
          { label: "Drop-off Count", value: (starts - completes).toLocaleString() }
        ],
        formula: "VCR = (Completed Views / Video Starts) × 100"
      };
    }
  },

  "cpm-calculator": {
    fields: [
      { id: "cost", label: "Total Advertising Cost ($)", type: "number", default: "2500" },
      { id: "impressions", label: "Total Impressions Delivered", type: "number", default: "175000" }
    ],
    note: "Cost Per Mille (CPM) calculates the price per 1,000 ad impressions across programmatic, display, and social media.",
    compute(v) {
      const cost = num(v.cost, "Cost", { min: 0 });
      const imp = num(v.impressions, "Impressions", { min: 1, allowZero: false });
      const cpm = (cost / imp) * 1000;
      return {
        results: [
          { label: "CPM (Cost Per 1,000 Impressions)", value: usd(cpm), primary: true },
          { label: "Cost Per Single Impression", value: `$${(cost / imp).toFixed(5)}` }
        ],
        formula: "CPM = (Total Cost / Impressions) × 1,000"
      };
    }
  },

  "cro-impact-calculator": {
    fields: [
      { id: "monthlyVisitors", label: "Monthly Website Visitors", type: "number", default: "80000" },
      { id: "currentCr", label: "Current Conversion Rate (%)", type: "number", default: "2.2", step: "0.1" },
      { id: "targetCr", label: "Improved Conversion Rate (%)", type: "number", default: "3.0", step: "0.1" },
      { id: "orderValue", label: "Average Value per Conversion ($)", type: "number", default: "95" }
    ],
    note: "Demonstrates the compounded revenue upside of on-site Conversion Rate Optimization (CRO).",
    compute(v) {
      const visitors = num(v.monthlyVisitors, "Visitors", { min: 1 });
      const cr1 = num(v.currentCr, "Current CR", { min: 0.01 }) / 100;
      const cr2 = num(v.targetCr, "Target CR", { min: 0.01 }) / 100;
      const val = num(v.orderValue, "Order Value", { min: 0.01 });
      const conv1 = visitors * cr1;
      const conv2 = visitors * cr2;
      const addConv = conv2 - conv1;
      const monthlyLift = addConv * val;
      return {
        results: [
          { label: "Monthly Revenue Increase", value: `+${usd(monthlyLift)}`, primary: true },
          { label: "Annualized Revenue Lift", value: `+${usd(monthlyLift * 12)}` },
          { label: "Additional Monthly Conversions", value: `+${Math.round(addConv).toLocaleString()} orders` }
        ],
        formula: "Lift = Visitors × (Target CR - Current CR) × Order Value"
      };
    }
  },

  "landing-page-bounce-loss": {
    fields: [
      { id: "visitors", label: "Monthly Paid Landing Page Visitors", type: "number", default: "25000" },
      { id: "cpc", label: "Average Cost Per Click (CPC) ($)", type: "number", default: "3.50", step: "0.1" },
      { id: "bounceRate", label: "Landing Page Bounce Rate (%)", type: "number", default: "62", step: "1" }
    ],
    note: "Calculates the monetary ad spend lost directly to visitors bouncing immediately without interacting.",
    compute(v) {
      const visitors = num(v.visitors, "Visitors", { min: 1 });
      const cpc = num(v.cpc, "CPC", { min: 0.01 });
      const br = num(v.bounceRate, "Bounce Rate", { min: 0, max: 100 }) / 100;
      const totalSpend = visitors * cpc;
      const wastedSpend = totalSpend * br;
      const bouncedCount = Math.round(visitors * br);
      return {
        results: [
          { label: "Monthly Wasted Ad Spend from Bounces", value: usd(wastedSpend), primary: true },
          { label: "Total Monthly Traffic Spend", value: usd(totalSpend) },
          { label: "Bounced Visitors Count", value: bouncedCount.toLocaleString() }
        ],
        formula: "Wasted Spend = Visitors × CPC × Bounce Rate %"
      };
    }
  },

  "event-sponsorship-roi": {
    fields: [
      { id: "sponsorshipCost", label: "Total Sponsorship & Booth Cost ($)", type: "number", default: "15000" },
      { id: "travelStaffCost", label: "Travel & Staffing Cost ($)", type: "number", default: "4500" },
      { id: "leadsCollected", label: "Qualified Leads Collected", type: "number", default: "120" },
      { id: "dealsClosedValue", label: "Attributed Closed Pipeline Value ($)", type: "number", default: "68000" }
    ],
    note: "Calculates Cost Per Event Lead and Net Return on Investment for trade shows and conferences.",
    compute(v) {
      const fee = num(v.sponsorshipCost, "Sponsorship", { min: 0 });
      const travel = num(v.travelStaffCost, "Travel", { min: 0 });
      const leads = num(v.leadsCollected, "Leads", { min: 1, allowZero: false });
      const pipeline = num(v.dealsClosedValue, "Closed Deals", { min: 0 });
      const totalCost = fee + travel;
      const costPerLead = totalCost / leads;
      const netProfit = pipeline - totalCost;
      const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
      return {
        results: [
          { label: "Event ROI", value: pct(roi), primary: true },
          { label: "Cost Per Qualified Lead (CPQL)", value: usd(costPerLead) },
          { label: "Net Event Profit", value: usd(netProfit) }
        ],
        formula: "ROI = (Pipeline - Total Cost) / Total Cost | CPQL = Total Cost / Leads"
      };
    }
  },

  "sms-marketing-roi": {
    fields: [
      { id: "subscribers", label: "SMS Campaign Recipients", type: "number", default: "15000" },
      { id: "costPerSms", label: "Carrier Fee per Message ($)", type: "number", default: "0.02", step: "0.005" },
      { id: "conversionRate", label: "Click-to-Purchase Rate (%)", type: "number", default: "3.2", step: "0.1" },
      { id: "aov", label: "Average Order Value ($)", type: "number", default: "75" }
    ],
    note: "Calculates SMS campaign delivery costs, generated orders, and marketing ROI.",
    compute(v) {
      const subs = num(v.subscribers, "Recipients", { min: 1 });
      const msgCost = num(v.costPerSms, "Cost per SMS", { min: 0.001 });
      const cr = num(v.conversionRate, "Conversion Rate", { min: 0.01 }) / 100;
      const aov = num(v.aov, "AOV", { min: 1 });
      const totalCost = subs * msgCost;
      const orders = Math.round(subs * cr);
      const revenue = orders * aov;
      const netProfit = revenue - totalCost;
      const roi = (netProfit / totalCost) * 100;
      return {
        results: [
          { label: "SMS Campaign ROI", value: pct(roi), primary: true },
          { label: "Total Campaign Revenue", value: usd(revenue) },
          { label: "Total SMS Delivery Cost", value: usd(totalCost) },
          { label: "Orders Generated", value: `${orders.toLocaleString()} orders` }
        ],
        formula: "ROI = (Revenue - SMS Delivery Cost) / SMS Delivery Cost"
      };
    }
  },

  "webinar-funnel-calculator": {
    fields: [
      { id: "registrants", label: "Total Webinar Registrants", type: "number", default: "850" },
      { id: "attendees", label: "Live Attendees", type: "number", default: "340" },
      { id: "buyers", label: "Offer Purchasers / Conversions", type: "number", default: "38" },
      { id: "price", label: "Product / Course Price ($)", type: "number", default: "497" }
    ],
    note: "Tracks live attendance rate, pitch conversion rate, and revenue per webinar registrant.",
    compute(v) {
      const reg = num(v.registrants, "Registrants", { min: 1, allowZero: false });
      const att = num(v.attendees, "Attendees", { min: 1, allowZero: false });
      const buyers = num(v.buyers, "Buyers", { min: 0 });
      const price = num(v.price, "Price", { min: 1 });
      const showUpRate = (att / reg) * 100;
      const buyerConv = (buyers / att) * 100;
      const totalRev = buyers * price;
      const revPerReg = totalRev / reg;
      return {
        results: [
          { label: "Total Webinar Sales Revenue", value: usd(totalRev), primary: true },
          { label: "Earnings Per Registrant (EPR)", value: usd(revPerReg) },
          { label: "Show-Up Rate", value: pct(showUpRate) },
          { label: "Pitch Conversion Rate", value: pct(buyerConv) }
        ],
        formula: "Show-Up = (Attendees / Registrants) | Pitch Conv = (Buyers / Attendees)"
      };
    }
  },

  "podcast-ad-roi": {
    fields: [
      { id: "downloads", label: "Expected Episode Downloads (30-day)", type: "number", default: "65000" },
      { id: "cpm", label: "Podcast Sponsor CPM ($)", type: "number", default: "25" },
      { id: "conversionRate", label: "Listener-to-Customer Conversion Rate (%)", type: "number", default: "0.25", step: "0.05" },
      { id: "customerValue", label: "Customer Lifetime Value or AOV ($)", type: "number", default: "150" }
    ],
    note: "Evaluates host-read or dynamic audio ad placements against customer conversions.",
    compute(v) {
      const dl = num(v.downloads, "Downloads", { min: 1 });
      const cpm = num(v.cpm, "CPM", { min: 1 });
      const cr = num(v.conversionRate, "Conversion %", { min: 0.001 }) / 100;
      const ltv = num(v.customerValue, "Customer Value", { min: 1 });
      const adCost = (dl / 1000) * cpm;
      const newCustomers = Math.round(dl * cr);
      const totalRevenue = newCustomers * ltv;
      const netProfit = totalRevenue - adCost;
      const roi = (netProfit / adCost) * 100;
      return {
        results: [
          { label: "Podcast Sponsorship ROI", value: pct(roi), primary: true },
          { label: "Sponsorship Ad Cost", value: usd(adCost) },
          { label: "Estimated New Customers", value: newCustomers.toLocaleString() },
          { label: "Total Attributed Revenue", value: usd(totalRevenue) }
        ],
        formula: "Cost = (Downloads / 1000) × CPM | ROI = (Revenue - Cost) / Cost"
      };
    }
  },

  "seo-traffic-value": {
    fields: [
      { id: "monthlyClicks", label: "Monthly Organic Google Clicks", type: "number", default: "35000" },
      { id: "avgCpc", label: "Equivalent Google Ads Paid CPC ($)", type: "number", default: "2.85", step: "0.05" }
    ],
    note: "Calculates the monetary cost you would have had to pay Google Ads to acquire your organic search traffic.",
    compute(v) {
      const clicks = num(v.monthlyClicks, "Monthly Clicks", { min: 0 });
      const cpc = num(v.avgCpc, "Average CPC", { min: 0.01 });
      const monthlyVal = clicks * cpc;
      const annualVal = monthlyVal * 12;
      return {
        results: [
          { label: "Monthly Organic Traffic Value", value: usd(monthlyVal), primary: true },
          { label: "Annualized SEO Value", value: usd(annualVal) }
        ],
        formula: "SEO Value = Organic Clicks × Equivalent Paid CPC"
      };
    }
  },

  "push-notification-engagement": {
    fields: [
      { id: "sent", label: "Push Notifications Sent", type: "number", default: "100000" },
      { id: "delivered", label: "Successfully Delivered", type: "number", default: "92000" },
      { id: "clicked", label: "Notifications Clicked / Opened", type: "number", default: "6400" }
    ],
    note: "Mobile app and web push engagement metrics: Deliverability Rate and Open/Click Rate.",
    compute(v) {
      const sent = num(v.sent, "Sent", { min: 1, allowZero: false });
      const del = num(v.delivered, "Delivered", { min: 1, allowZero: false });
      const click = num(v.clicked, "Clicked", { min: 0 });
      const delRate = (del / sent) * 100;
      const clickRate = (click / del) * 100;
      return {
        results: [
          { label: "Click Rate (CTR on Delivery)", value: pct(clickRate), primary: true },
          { label: "Deliverability Rate", value: pct(delRate) },
          { label: "Undelivered / Bounced", value: (sent - del).toLocaleString() }
        ],
        formula: "CTR = (Clicks / Delivered) × 100 | Deliverability = (Delivered / Sent) × 100"
      };
    }
  },

  "viral-coefficient-calculator": {
    fields: [
      { id: "invitesSentPerUser", label: "Average Invites Sent Per Active User", type: "number", default: "3.5", step: "0.1" },
      { id: "acceptanceRate", label: "Invite Acceptance / Conversion Rate (%)", type: "number", default: "32", step: "1" }
    ],
    note: "The K-factor determines if product growth is viral. K > 1 indicates exponential, self-sustaining virality.",
    compute(v) {
      const invites = num(v.invitesSentPerUser, "Invites Per User", { min: 0 });
      const conv = num(v.acceptanceRate, "Acceptance Rate", { min: 0, max: 100 }) / 100;
      const k = invites * conv;
      let status = "Sub-viral (K < 1) - Requires paid acquisition or SEO to sustain";
      if (k > 1.0) status = "True Exponential Virality (K > 1) - Self-sustaining loop";
      else if (Math.abs(k - 1.0) < 0.05) status = "Equilibrium Virality (K ≈ 1)";
      return {
        results: [
          { label: "Viral Coefficient (K-Factor)", value: k.toFixed(2), primary: true },
          { label: "Virality Assessment", value: status }
        ],
        formula: "K = Invites Sent Per User × Conversion Rate %"
      };
    }
  },

  "blended-cpa-calculator": {
    fields: [
      { id: "totalMarketingSpend", label: "Total Paid Marketing Spend ($)", type: "number", default: "30000" },
      { id: "paidConversions", label: "Direct Paid Conversions", type: "number", default: "400" },
      { id: "organicConversions", label: "Direct Organic / Referral Conversions", type: "number", default: "250" }
    ],
    note: "Blended Cost Per Acquisition measures the true cost of acquiring each customer across all channels.",
    compute(v) {
      const spend = num(v.totalMarketingSpend, "Marketing Spend", { min: 0 });
      const paidConv = num(v.paidConversions, "Paid Conversions", { min: 1, allowZero: false });
      const orgConv = num(v.organicConversions, "Organic Conversions", { min: 0 });
      const totalConv = paidConv + orgConv;
      const paidCpa = spend / paidConv;
      const blendedCpa = spend / totalConv;
      return {
        results: [
          { label: "Blended CPA (All Channels)", value: usd(blendedCpa), primary: true },
          { label: "Paid-Only CPA", value: usd(paidCpa) },
          { label: "Organic Halo Effect Savings", value: usd(paidCpa - blendedCpa) }
        ],
        formula: "Blended CPA = Total Marketing Spend / Total Conversions"
      };
    }
  },

  "ad-spend-pacing": {
    fields: [
      { id: "monthlyBudget", label: "Total Monthly Advertising Budget ($)", type: "number", default: "15000" },
      { id: "spendToDate", label: "Ad Spend to Date ($)", type: "number", default: "7200" },
      { id: "daysElapsed", label: "Days Elapsed in Current Month", type: "number", default: "14" },
      { id: "daysInMonth", label: "Total Days in Current Month (e.g. 30 or 31)", type: "number", default: "30" }
    ],
    note: "Monitors daily budget consumption to prevent premature month-end budget exhaustion or under-spending.",
    compute(v) {
      const budget = num(v.monthlyBudget, "Budget", { min: 1 });
      const spend = num(v.spendToDate, "Spend to Date", { min: 0 });
      const elapsed = num(v.daysElapsed, "Days Elapsed", { min: 1 });
      const totalDays = num(v.daysInMonth, "Days in Month", { min: elapsed });
      const remainingDays = totalDays - elapsed;
      const remainingBudget = budget - spend;
      const idealDaily = budget / totalDays;
      const actualDailyRate = spend / elapsed;
      const projectedEndSpend = spend + (actualDailyRate * remainingDays);
      const targetDailyRemaining = remainingDays > 0 ? remainingBudget / remainingDays : 0;
      return {
        results: [
          { label: "Recommended Remaining Daily Budget", value: usd(targetDailyRemaining), primary: true },
          { label: "Projected Month-End Spend", value: usd(projectedEndSpend) },
          { label: "Pacing Status", value: projectedEndSpend > budget ? `Over-pacing by +${usd(projectedEndSpend - budget)}` : `Under-pacing by -${usd(budget - projectedEndSpend)}` },
          { label: "Ideal Uniform Daily Spend", value: usd(idealDaily) }
        ],
        formula: "Remaining Daily = (Budget - Spend to Date) / Remaining Days"
      };
    }
  },

  "cpv-calculator": {
    fields: [
      { id: "campaignCost", label: "Total Video Campaign Cost ($)", type: "number", default: "1800" },
      { id: "views", label: "Total Views Delivered", type: "number", default: "45000" }
    ],
    note: "Cost Per View (CPV) standard for YouTube TrueView, TikTok In-Feed, and Meta video ads.",
    compute(v) {
      const cost = num(v.campaignCost, "Cost", { min: 0 });
      const views = num(v.views, "Views", { min: 1, allowZero: false });
      const cpv = cost / views;
      return {
        results: [
          { label: "Cost Per View (CPV)", value: `$${cpv.toFixed(4)}`, primary: true },
          { label: "Views Per Dollar Spent", value: `${Math.round(views / Math.max(1, cost))} views/$` }
        ],
        formula: "CPV = Total Campaign Cost / Total Views"
      };
    }
  },

  "cpi-calculator": {
    fields: [
      { id: "totalSpend", label: "Total App Marketing Spend ($)", type: "number", default: "12500" },
      { id: "installs", label: "Total App Installs Tracked", type: "number", default: "5400" },
      { id: "installToUserRate", label: "Install-to-Registered User Rate (%)", type: "number", default: "65", step: "1" }
    ],
    note: "Calculates Cost Per Install (CPI) and Cost Per Registered Active User for mobile iOS/Android apps.",
    compute(v) {
      const spend = num(v.totalSpend, "Spend", { min: 1 });
      const installs = num(v.installs, "Installs", { min: 1, allowZero: false });
      const regRate = num(v.installToUserRate, "Registration %", { min: 1, max: 100 }) / 100;
      const cpi = spend / installs;
      const registeredUsers = Math.round(installs * regRate);
      const costPerUser = spend / registeredUsers;
      return {
        results: [
          { label: "Cost Per Install (CPI)", value: usd(cpi), primary: true },
          { label: "Cost Per Registered Active User", value: usd(costPerUser) },
          { label: "Total Registered Users", value: registeredUsers.toLocaleString() }
        ],
        formula: "CPI = Total Ad Spend / App Installs"
      };
    }
  },

  "lead-to-customer-conversion": {
    fields: [
      { id: "mqls", label: "Marketing Qualified Leads (MQLs)", type: "number", default: "600" },
      { id: "sqlRate", label: "MQL to SQL Acceptance Rate (%)", type: "number", default: "40", step: "1" },
      { id: "closeRate", label: "SQL to Closed-Won Opportunity Rate (%)", type: "number", default: "25", step: "1" },
      { id: "acv", label: "Average Contract Value (ACV) ($)", type: "number", default: "8500" }
    ],
    note: "Maps the sales velocity funnel from marketing qualified lead to signed contract.",
    compute(v) {
      const mqls = num(v.mqls, "MQLs", { min: 1 });
      const sqlRate = num(v.sqlRate, "SQL %", { min: 1, max: 100 }) / 100;
      const closeRate = num(v.closeRate, "Close %", { min: 1, max: 100 }) / 100;
      const acv = num(v.acv, "ACV", { min: 1 });
      const sqls = Math.round(mqls * sqlRate);
      const deals = Math.round(sqls * closeRate);
      const revenue = deals * acv;
      const overallCr = (deals / mqls) * 100;
      return {
        results: [
          { label: "New Closed Customer Deals", value: `${deals} customers`, primary: true },
          { label: "Pipeline Revenue Generated", value: usd(revenue) },
          { label: "End-to-End Funnel Conversion Rate", value: pct(overallCr) },
          { label: "Sales Qualified Leads (SQLs)", value: sqls.toLocaleString() }
        ],
        formula: "Deals = MQLs × SQL% × Close% | Revenue = Deals × ACV"
      };
    }
  },

  "email-list-churn": {
    fields: [
      { id: "initialSize", label: "Email Subscribers at Start of Month", type: "number", default: "45000" },
      { id: "unsubscribes", label: "Monthly Unsubscribes", type: "number", default: "420" },
      { id: "hardBounces", label: "Monthly Hard Bounces / Invalid Emails", type: "number", default: "115" },
      { id: "newSubscribers", label: "New Subscribers Added This Month", type: "number", default: "980" }
    ],
    note: "Monitors newsletter health: list churn rate versus monthly list growth rate.",
    compute(v) {
      const start = num(v.initialSize, "Start Size", { min: 1, allowZero: false });
      const unsubs = num(v.unsubscribes, "Unsubs", { min: 0 });
      const bounces = num(v.hardBounces, "Bounces", { min: 0 });
      const newSubs = num(v.newSubscribers, "New Subs", { min: 0 });
      const lost = unsubs + bounces;
      const churnRate = (lost / start) * 100;
      const growthRate = ((newSubs - lost) / start) * 100;
      const endSize = start + newSubs - lost;
      return {
        results: [
          { label: "Monthly List Churn Rate", value: pct(churnRate), primary: true },
          { label: "Net Monthly List Growth", value: `${growthRate >= 0 ? "+" : ""}${pct(growthRate)} (${(newSubs - lost).toLocaleString()} net)` },
          { label: "Month-End List Size", value: endSize.toLocaleString() }
        ],
        formula: "Churn Rate = (Unsubscribes + Bounces) / Initial List Size"
      };
    }
  },

  "social-engagement-rate": {
    fields: [
      { id: "interactions", label: "Total Interactions (Likes + Comments + Shares + Saves)", type: "number", default: "3850" },
      { id: "reachOrFollowers", label: "Total Post Impressions / Reach (or Total Followers)", type: "number", default: "85000" }
    ],
    note: "Standard Instagram, LinkedIn, X, and TikTok engagement metric.",
    compute(v) {
      const interactions = num(v.interactions, "Interactions", { min: 0 });
      const total = num(v.reachOrFollowers, "Reach/Followers", { min: 1, allowZero: false });
      const er = (interactions / total) * 100;
      return {
        results: [
          { label: "Social Engagement Rate", value: pct(er), primary: true },
          { label: "Benchmark Assessment", value: er >= 3.5 ? "High Engagement (≥ 3.5%)" : er >= 1.5 ? "Average Engagement (1.5% - 3.5%)" : "Low Engagement (< 1.5%)" }
        ],
        formula: "Engagement Rate = (Total Interactions / Total Reach or Followers) × 100"
      };
    }
  },

  "ctor-calculator": {
    fields: [
      { id: "uniqueOpens", label: "Unique Email Opens", type: "number", default: "8500" },
      { id: "uniqueClicks", label: "Unique Email Clicks", type: "number", default: "1150" }
    ],
    note: "Click-to-Open Rate (CTOR) isolates content quality from subject line effectiveness.",
    compute(v) {
      const opens = num(v.uniqueOpens, "Opens", { min: 1, allowZero: false });
      const clicks = num(v.uniqueClicks, "Clicks", { min: 0 });
      if (clicks > opens) throw new Error("Clicks cannot exceed opens.");
      const ctor = (clicks / opens) * 100;
      return {
        results: [
          { label: "Click-to-Open Rate (CTOR)", value: pct(ctor), primary: true },
          { label: "Content Quality", value: ctor >= 15 ? "High Content Resonance (≥ 15%)" : "Content Needs Better Hooks/CTA (< 15%)" }
        ],
        formula: "CTOR = (Unique Clicks / Unique Opens) × 100"
      };
    }
  },

  "customer-referral-roi": {
    fields: [
      { id: "rewardCostPerReferral", label: "Referral Incentive / Reward Cost ($)", type: "number", default: "25" },
      { id: "successfulReferrals", label: "New Referred Customers Acquired", type: "number", default: "180" },
      { id: "referralRevenue", label: "First-Year Revenue from Referred Customers ($)", type: "number", default: "27000" }
    ],
    note: "Calculates the net profitability and effective acquisition cost of a customer advocacy referral program.",
    compute(v) {
      const reward = num(v.rewardCostPerReferral, "Reward Cost", { min: 0 });
      const count = num(v.successfulReferrals, "Referrals", { min: 1, allowZero: false });
      const rev = num(v.referralRevenue, "Revenue", { min: 0 });
      const programCost = reward * count;
      const netProfit = rev - programCost;
      const roi = programCost > 0 ? (netProfit / programCost) * 100 : 0;
      const effectiveCac = programCost / count;
      return {
        results: [
          { label: "Referral Program ROI", value: pct(roi), primary: true },
          { label: "Effective Referral CAC", value: usd(effectiveCac) },
          { label: "Net Program Profit", value: usd(netProfit) }
        ],
        formula: "ROI = (Referred Revenue - Reward Cost) / Reward Cost"
      };
    }
  }
};
