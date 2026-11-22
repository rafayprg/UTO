export interface GrowthEcommerceToolData {
  id: string;
  slug: string;
  name: string;
  title: string;
  shortDesc: string;
  seoTitle: string;
  metaDescription: string;
  category: "business";
  group: "E-Commerce & Growth Engines";
  calcType:
    | "roas-breakeven"
    | "target-cpa"
    | "blended-cac"
    | "ltv"
    | "ltv-cac-ratio"
    | "shopify-margin"
    | "tiktok-shop"
    | "etsy-pricing"
    | "amazon-acos"
    | "email-roi"
    | "influencer-cpm"
    | "saas-rule-of-40";
  defaultInputs: Record<string, number | string | boolean>;
  formulaExplanation: string;
  workedExamples: {
    title: string;
    inputSummary: string;
    resultSummary: string;
  }[];
  faqs: { question: string; answer: string }[];
  keywords: string[];
}

export const GROWTH_ECOMMERCE_TOOLS: GrowthEcommerceToolData[] = [
  {
    id: "prog-breakeven-roas-calculator",
    slug: "breakeven-roas-calculator",
    name: "Breakeven ROAS Calculator",
    title: "Breakeven ROAS Calculator (Target Return on Ad Spend)",
    shortDesc: "Calculate the exact minimum ROAS (Return On Ad Spend) and profit margin needed to prevent losing money on Meta, Google, and TikTok ads.",
    seoTitle: "Breakeven ROAS Calculator – Minimum Target Return On Ad Spend",
    metaDescription: "Free Breakeven ROAS calculator. Calculate target return on ad spend from gross margin and COGS to ensure ad profitability. 100% private.",
    category: "business",
    group: "E-Commerce & Growth Engines",
    calcType: "roas-breakeven",
    defaultInputs: {
      sellingPrice: 100,
      cogs: 30,
      shippingAndFulfillment: 10,
      paymentProcessingFeePercent: 3.0,
      targetProfitMargin: 15, // % desired profit
    },
    formulaExplanation: "Contribution Margin % = (Price − COGS − Shipping − Fees) / Price. Breakeven ROAS = 1 / Contribution Margin %. Target ROAS = 1 / (Contribution Margin % − Target Margin %).",
    workedExamples: [
      {
        title: "$100 Product with $40 Total Unit Costs",
        inputSummary: "$100 price, $30 COGS, $10 shipping, 3% merchant fee ($57 contribution margin = 57%).",
        resultSummary: "Breakeven ROAS is 1.75x (175%). For a 15% net profit margin, your target ROAS must be at least 2.38x (238%).",
      },
    ],
    faqs: [
      {
        question: "What does a 2.0x Breakeven ROAS mean?",
        answer: "A 2.0x breakeven ROAS means that for every $1 spent on advertising, you must generate at least $2 in revenue just to pay for product manufacturing, shipping, and ad spend.",
      },
      {
        question: "How do return rates affect Breakeven ROAS?",
        answer: "Returns reduce realized revenue while still incurring shipping and fulfillment costs, which raises your required breakeven ROAS threshold.",
      },
    ],
    keywords: ["breakeven roas calculator", "minimum roas calculator", "target return on ad spend", "ecommerce ad profit margin"],
  },
  {
    id: "prog-target-cpa-calculator",
    slug: "target-cpa-calculator",
    name: "Target CPA Calculator",
    title: "Target CPA Calculator (Cost Per Acquisition & Allowable Ad Spend)",
    shortDesc: "Calculate your maximum allowable Cost Per Acquisition (CPA) on Google and Meta Ads based on Average Order Value (AOV) and margins.",
    seoTitle: "Target CPA Calculator – Maximum Allowable Ad Cost Per Acquisition",
    metaDescription: "Calculate maximum allowable CPA and target acquisition cost. Keep Meta and Google Ads profitable with exact unit economics. 100% private.",
    category: "business",
    group: "E-Commerce & Growth Engines",
    calcType: "target-cpa",
    defaultInputs: {
      averageOrderValue: 85,
      costPerUnit: 25,
      shippingCost: 8,
      overheadPerOrder: 5,
      desiredNetProfitPerOrder: 15,
    },
    formulaExplanation: "Max Allowable CPA = AOV − COGS − Shipping − Overhead − Desired Profit Per Order.",
    workedExamples: [
      {
        title: "$85 AOV with $38 Unit Costs and $15 Profit Target",
        inputSummary: "$85 order value, $25 product cost, $8 shipping, $5 operating overhead, $15 target profit.",
        resultSummary: "Target CPA is $32.00. You can spend up to $32 on customer acquisition per sale and maintain your $15 net profit target.",
      },
    ],
    faqs: [
      {
        question: "What is the difference between CPA and CAC?",
        answer: "CPA usually measures cost per conversion or transaction in paid ad campaigns, whereas CAC (Customer Acquisition Cost) accounts for acquiring unique paying customers across all marketing overhead.",
      },
    ],
    keywords: ["target cpa calculator", "allowable cpa calculator", "cost per acquisition calculator", "ecommerce cpa target"],
  },
  {
    id: "prog-blended-cac-calculator",
    slug: "blended-cac-calculator",
    name: "Blended CAC & Paid CAC Calculator",
    title: "Blended CAC Calculator (Paid vs Organic Customer Acquisition Cost)",
    shortDesc: "Measure true acquisition efficiency by comparing Paid CAC against Blended CAC across all marketing channels, salaries, and organic traffic.",
    seoTitle: "Blended CAC Calculator – Paid CAC vs Total Blended Marketing Efficiency",
    metaDescription: "Calculate Blended CAC vs Paid CAC across all channels, agency fees, and marketing team spend. 100% client-side privacy.",
    category: "business",
    group: "E-Commerce & Growth Engines",
    calcType: "blended-cac",
    defaultInputs: {
      totalAdSpend: 45000,
      agencyAndToolCosts: 8000,
      marketingSalaries: 15000,
      newCustomersFromPaidAds: 900,
      newCustomersFromOrganic: 600,
    },
    formulaExplanation: "Paid CAC = Total Ad Spend / Paid Customers. Blended CAC = (Ad Spend + Tools + Salaries) / Total Customers (Paid + Organic).",
    workedExamples: [
      {
        title: "$68,000 Marketing Spend for 1,500 Total Customers",
        inputSummary: "$45k ad spend, $23k team/tools, 900 paid customers, 600 organic customers.",
        resultSummary: "Paid CAC is $50.00 per customer, while Blended CAC drops to $45.33 per customer due to organic flywheels.",
      },
    ],
    faqs: [
      {
        question: "Why is Blended CAC alone sometimes misleading?",
        answer: "Blended CAC can mask unprofitable paid ad campaigns if strong brand/organic traffic inflates customer counts. You should track both Paid CAC and Blended CAC.",
      },
    ],
    keywords: ["blended cac calculator", "customer acquisition cost calculator", "paid cac vs blended cac", "ecommerce mer calculator"],
  },
  {
    id: "prog-customer-lifetime-value-ltv-calculator",
    slug: "customer-lifetime-value-ltv-calculator",
    name: "Customer Lifetime Value (LTV) Calculator",
    title: "Customer Lifetime Value (LTV) Calculator (Retention & Margins)",
    shortDesc: "Calculate historical and predictive customer lifetime value (LTV) using average purchase frequency, gross margin, and monthly churn rate.",
    seoTitle: "Customer Lifetime Value Calculator (LTV) – E-commerce & SaaS LTV",
    metaDescription: "Calculate customer lifetime value (LTV) using purchase frequency, AOV, gross margin %, and churn rate. 100% private.",
    category: "business",
    group: "E-Commerce & Growth Engines",
    calcType: "ltv",
    defaultInputs: {
      averageOrderValue: 70,
      purchaseFrequencyPerYear: 3.5,
      customerLifespanYears: 3,
      grossMarginPercent: 65,
    },
    formulaExplanation: "Customer Value = AOV × Purchase Frequency. Gross LTV = Customer Value × Lifespan. Net Margin LTV = Gross LTV × (Gross Margin % / 100).",
    workedExamples: [
      {
        title: "DTC Brand with 3.5 purchases/yr and 65% Gross Margin",
        inputSummary: "$70 AOV, 3.5 orders per year over a 3-year customer lifespan.",
        resultSummary: "Customer generates $735 in total gross revenue. Net Margin LTV is $477.75 in cumulative contribution profit.",
      },
    ],
    faqs: [
      {
        question: "Why should LTV be calculated on Gross Margin rather than Revenue?",
        answer: "Revenue LTV overstates how much you can spend on customer acquisition. Margin-adjusted LTV reflects actual cash available to cover operating overhead and profit.",
      },
    ],
    keywords: ["ltv calculator", "customer lifetime value calculator", "clv formula calculator", "saas ltv calculator"],
  },
  {
    id: "prog-ltv-to-cac-ratio-calculator",
    slug: "ltv-to-cac-ratio-calculator",
    name: "LTV:CAC Ratio Calculator",
    title: "LTV:CAC Ratio Calculator (Unit Economics & Payback Period)",
    shortDesc: "Evaluate business health and growth sustainability: determine whether you are under-investing (<3:1), in the golden zone (3:1 to 5:1), or burning capital.",
    seoTitle: "LTV to CAC Ratio Calculator – SaaS & E-commerce Unit Economics",
    metaDescription: "Calculate your LTV:CAC ratio and CAC payback period in months. Benchmark your startup against top quartile SaaS standards. 100% private.",
    category: "business",
    group: "E-Commerce & Growth Engines",
    calcType: "ltv-cac-ratio",
    defaultInputs: {
      ltv: 1200,
      cac: 350,
      monthlyGrossProfitPerUser: 100,
    },
    formulaExplanation: "LTV:CAC Ratio = Customer Lifetime Value / Customer Acquisition Cost. Payback Period (Months) = CAC / Monthly Gross Margin Per User.",
    workedExamples: [
      {
        title: "$1,200 LTV with $350 CAC",
        inputSummary: "$1,200 lifetime gross profit, $350 acquisition cost, $100/mo gross profit.",
        resultSummary: "LTV:CAC ratio is 3.43:1 (Healthy Growth zone). CAC payback is achieved in 3.5 months.",
      },
    ],
    faqs: [
      {
        question: "What is an ideal LTV:CAC ratio?",
        answer: "A ratio of 3:1 is standard for healthy startups. Below 2:1 indicates unprofitable unit economics, while above 5:1 often means you are under-investing in marketing.",
      },
    ],
    keywords: ["ltv to cac ratio calculator", "ltv cac benchmark", "cac payback period calculator", "saas unit economics"],
  },
  {
    id: "prog-shopify-profit-margin-calculator",
    slug: "shopify-profit-margin-calculator",
    name: "Shopify Store Profit Margin Calculator",
    title: "Shopify Profit Margin Calculator (True Net Margin after Apps & Ad Spend)",
    shortDesc: "Calculate true Shopify store net profit by factoring Shopify subscription tier, transaction fees (Shopify Payments), app stack subscriptions, and ad spend.",
    seoTitle: "Shopify Profit Margin Calculator – Real Store Net Take-Home",
    metaDescription: "Calculate true Shopify net profit after Shopify Payments fees (2.9% + 30¢), monthly app bills, COGS, and ad spend. 100% private.",
    category: "business",
    group: "E-Commerce & Growth Engines",
    calcType: "shopify-margin",
    defaultInputs: {
      monthlyRevenue: 35000,
      totalCogs: 11000,
      monthlyAdSpend: 10500,
      shopifyMonthlyPlanCost: 105, // Shopify Grow plan
      shopifyAppSubscriptions: 350, // Klaviyo, Loox, Rebuy, etc.
      transactionFeePercent: 2.7,
      transactionFixedFee: 0.3,
      totalOrders: 420,
    },
    formulaExplanation: "Payment Fees = (Revenue × 2.7%) + (Orders × $0.30). Net Profit = Revenue − COGS − Ad Spend − Plan − Apps − Payment Fees.",
    workedExamples: [
      {
        title: "$35,000/mo Shopify Store",
        inputSummary: "$35,000 revenue across 420 orders, $11k COGS, $10.5k ad spend, $455 apps/plan, 2.7% + 30¢ gateway.",
        resultSummary: "Payment processing fees: $1,071. Net profit in pocket: $11,974 (34.2% net profit margin).",
      },
    ],
    faqs: [
      {
        question: "What are Shopify Payments transaction fee rates in 2026?",
        answer: "Basic Shopify is 2.9% + 30¢, Shopify Plan is 2.7% + 30¢, and Advanced Shopify is 2.5% + 30¢ per online credit card transaction.",
      },
    ],
    keywords: ["shopify profit calculator", "shopify net margin calculator", "shopify payment fees calculator", "ecommerce store profit breakdown"],
  },
  {
    id: "prog-tiktok-shop-profit-calculator",
    slug: "tiktok-shop-profit-calculator",
    name: "TikTok Shop Fee & Margin Calculator",
    title: "TikTok Shop Fee & Profit Calculator (Referral Fees & Affiliate Commission)",
    shortDesc: "Calculate net payout and profit margins on TikTok Shop orders factoring the referral fee (6%–8%), creator affiliate commission cuts, and shipping subsidies.",
    seoTitle: "TikTok Shop Fee Calculator 2026 – Net Profit & Affiliate Commissions",
    metaDescription: "Calculate TikTok Shop seller fees, referral cuts, creator affiliate commission, and net payouts. 100% private client-side calculator.",
    category: "business",
    group: "E-Commerce & Growth Engines",
    calcType: "tiktok-shop",
    defaultInputs: {
      retailPrice: 45,
      cogs: 12,
      shippingCost: 5,
      tiktokReferralFeePercent: 6.0, // 6% base standard
      affiliateCommissionPercent: 15.0, // creator affiliate %
    },
    formulaExplanation: "TikTok Fee = Price × Referral %. Creator Commission = Price × Affiliate %. Net Payout = Price − TikTok Fee − Creator Commission − Shipping. Net Profit = Net Payout − COGS.",
    workedExamples: [
      {
        title: "$45 Viral Product with 15% Creator Affiliate Commission",
        inputSummary: "$45 retail, $12 COGS, $5 shipping, 6% TikTok referral fee ($2.70), 15% affiliate commission ($6.75).",
        resultSummary: "Total platform & creator fees: $9.45. Net seller profit: $18.55 per unit (41.2% net margin).",
      },
    ],
    faqs: [
      {
        question: "What is the standard TikTok Shop seller fee?",
        answer: "TikTok Shop charges a referral fee typically ranging from 6% to 8% depending on product category, plus transaction handling.",
      },
    ],
    keywords: ["tiktok shop fee calculator", "tiktok seller profit calculator", "tiktok affiliate commission calculator", "tiktok shop margins"],
  },
  {
    id: "prog-amazon-acos-tacos-calculator",
    slug: "amazon-acos-tacos-calculator",
    name: "Amazon ACoS & TACoS Calculator",
    title: "Amazon PPC ACoS & TACoS Calculator (Advertising vs Total Cost of Sales)",
    shortDesc: "Track Amazon PPC advertising efficiency: calculate Advertising Cost of Sales (ACoS), Total Advertising Cost of Sales (TACoS), and organic halo lift.",
    seoTitle: "Amazon ACoS & TACoS Calculator – Amazon PPC Profitability Metric",
    metaDescription: "Calculate Amazon ACoS and TACoS metrics. Understand PPC ad spend impact on total organic revenue. 100% private.",
    category: "business",
    group: "E-Commerce & Growth Engines",
    calcType: "amazon-acos",
    defaultInputs: {
      ppcAdSpend: 4200,
      ppcAdSales: 16800,
      totalStoreSales: 48000,
      productProfitMarginBeforeAds: 38,
    },
    formulaExplanation: "ACoS % = (Ad Spend / PPC Sales) × 100. TACoS % = (Ad Spend / Total Store Sales) × 100. Halo Lift = Total Sales / PPC Sales.",
    workedExamples: [
      {
        title: "$4,200 PPC Spend generating $16.8k Ad Sales and $48k Total Revenue",
        inputSummary: "$4.2k spend, $16.8k PPC revenue, $48k total sales with 38% gross margin.",
        resultSummary: "ACoS is 25.0% (Strong campaign efficiency). TACoS is 8.75% (Healthy organic flywheel with 2.85x organic halo lift).",
      },
    ],
    faqs: [
      {
        question: "What is considered a healthy TACoS on Amazon?",
        answer: "A healthy TACoS is generally between 8% and 15%. A decreasing TACoS while total revenue grows indicates strong organic ranking gains powered by PPC.",
      },
    ],
    keywords: ["amazon acos calculator", "amazon tacos calculator", "amazon ppc margin calculator", "advertising cost of sales formula"],
  },
  {
    id: "prog-saas-rule-of-40-calculator",
    slug: "saas-rule-of-40-calculator",
    name: "SaaS Rule of 40 & Magic Number Calculator",
    title: "SaaS Rule of 40 Calculator (Revenue Growth Rate + Free Cash Flow Margin)",
    shortDesc: "Benchmark software startup health for investors and venture capital: calculate Rule of 40 score, Magic Number sales efficiency, and ARR metrics.",
    seoTitle: "SaaS Rule of 40 Calculator – Growth Rate & Profitability Health Score",
    metaDescription: "Calculate your SaaS Rule of 40 score and Sales Magic Number. Benchmark against elite venture-backed SaaS metrics. 100% private.",
    category: "business",
    group: "E-Commerce & Growth Engines",
    calcType: "saas-rule-of-40",
    defaultInputs: {
      annualRevenueGrowthPercent: 35,
      freeCashFlowMarginPercent: 12,
      newArrQuarter: 250000,
      salesAndMarketingQuarter: 300000,
    },
    formulaExplanation: "Rule of 40 Score = YoY Revenue Growth % + FCF Margin %. Magic Number = (Quarterly Net New ARR × 4) / Prior Quarter S&M Spend.",
    workedExamples: [
      {
        title: "35% YoY ARR Growth with 12% FCF Margin",
        inputSummary: "35% revenue expansion, 12% cash generation, $250k new ARR on $300k sales & marketing spend.",
        resultSummary: "Rule of 40 score is 47.0% (Exceeds venture benchmark!). SaaS Magic Number is 3.33 (Highly efficient go-to-market engine).",
      },
    ],
    faqs: [
      {
        question: "What does the SaaS Rule of 40 mean?",
        answer: "The Rule of 40 is a principle where a SaaS company's revenue growth rate plus its profit margin should equal or exceed 40% to be considered elite and investable.",
      },
    ],
    keywords: ["saas rule of 40 calculator", "saas magic number calculator", "arr growth rate benchmark", "saas unit economics scorecard"],
  },
];
