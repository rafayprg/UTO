import { categories, type ToolCategory, type Tier1Category } from "./categories";
import { CATALOG, type CatalogEntry, type PlannedInput } from "./catalog";

export { categories, type ToolCategory, type Tier1Category };
export type ToolStatus = "live" | "planned";
export type LegacyComponentKey =
  | "background-remover"
  | "heic-converter"
  | "zip-tool"
  | "pdf-merger"
  | "json-formatter"
  | "qr-generator"
  | "word-counter"
  | "youtube-toolkit"
  | "percentage-calculator"
  | "unit-converter";

export interface ToolDefinition {
  id: string;
  slug: string;
  category: ToolCategory;
  name: string;
  title: string;
  shortDesc: string;
  seoTitle: string; // <= 60 chars, primary keyword first
  metaDescription: string; // 145-155 chars, benefit + "Free, No Signup"
  region?: "US" | "UK" | "CA" | "AU" | "GLOBAL";
  cpcTier: "high" | "medium";
  engineType: "native" | "wasm" | "worker";
  componentKey: string; // Lazy-loaded via next/dynamic({ ssr: false })
  preset?: Record<string, unknown>;
  formulaExplanation: string; // Rendered below workspace
  workedExamples: Array<{ title: string; inputSummary: string; resultSummary: string }>;
  faqs: Array<{ question: string; answer: string }>;
  relatedSlugs: string[];
  relatedBlogSlug?: string;
  status: ToolStatus;
  group: string;
  keywords: string[];
  indexable: boolean;
  isWasm: boolean;
  trending: boolean;
  plannedEngine?: string;
  plannedInput?: PlannedInput;
  faq: Array<{ q: string; a: string }>;
}

type DefinitionInput = Partial<ToolDefinition> & {
  slug: string;
  title: string;
  shortDesc: string;
  category: ToolCategory;
  componentKey: string;
  group: string;
  keywords: string[];
  engineType?: "native" | "wasm" | "worker";
  faqs?: Array<{ question: string; answer: string }>;
  faq?: Array<{ q: string; a: string }>;
  formulaExplanation?: string;
  workedExamples?: Array<{ title: string; inputSummary: string; resultSummary: string }>;
  relatedSlugs?: string[];
  seoTitle?: string;
  metaDescription?: string;
  cpcTier?: "high" | "medium";
  region?: "US" | "UK" | "CA" | "AU" | "GLOBAL";
  trending?: boolean;
};

/**
 * Generates an SEO title optimized for maximum organic Google CTR.
 * Ensures high-intent modifiers like "100% Free", "Online", "No Sign Up", and "Private"
 * are included while respecting search snippet width limits.
 */
export function generateSeoTitle(title: string, customSeoTitle?: string): string {
  if (customSeoTitle && /(?:100%\s*free|free\s*online).*(?:no\s*sign\s*up|private)/i.test(customSeoTitle)) {
    return customSeoTitle;
  }
  
  const base = (customSeoTitle || title)
    .replace(/\s*[-–:]\s*Free Online Tool$/i, "")
    .replace(/\s*[-–:]\s*Online$/i, "")
    .trim();

  // Tier 1: Very concise (<= 22 chars): fits all 4 intent modifiers within Google SERP snippet limit (~60 chars)
  if (base.length <= 22) {
    return `${base} – 100% Free Online, Private & No Sign Up`;
  }
  // Tier 2: Short (23 - 32 chars): fits in ~60-64 chars
  if (base.length <= 32) {
    return `${base} – 100% Free Online (Private, No Sign Up)`;
  }
  // Tier 3: Medium (33 - 42 chars): fits in ~62-66 chars
  if (base.length <= 42) {
    return `${base} – 100% Free Online, No Sign Up`;
  }
  // Tier 4: Long (> 42 chars)
  return `${base} – 100% Free Online (Private)`;
}

/**
 * Generates an SEO meta description with exact character budgeting (145-155 characters).
 * Front-loads user benefit and guarantees high-converting intent modifiers.
 */
export function generateMetaDescription(shortDesc: string, customDesc?: string): string {
  if (customDesc && customDesc.length >= 130 && /(?:100%\s*free|free|no\s*sign\s*up|private)/i.test(customDesc)) {
    return customDesc;
  }
  const clean = (customDesc || shortDesc).trim().replace(/[.,;:\s]+$/, "");
  const suffix = ". 100% free, private online tool with zero server uploads and no sign up required.";
  
  if (clean.length + suffix.length <= 158) {
    return `${clean}${suffix}`;
  }
  const maxBase = 155 - suffix.length;
  const truncated = clean.slice(0, maxBase).replace(/\s+\S*$/, "");
  return `${truncated}${suffix}`;
}

/**
 * Enriches tool keywords with organic high-conversion search queries.
 */
export function enrichToolKeywords(keywords: string[]): string[] {
  const defaults = ["100% free online", "no sign up", "private browser tool", "client side"];
  const set = new Set(keywords);
  for (const d of defaults) {
    set.add(d);
  }
  return Array.from(set);
}

function define(input: DefinitionInput): ToolDefinition {
  const faqs = input.faqs ?? (input.faq ? input.faq.map(f => ({ question: f.q, answer: f.a })) : []);
  const faq = input.faq ?? (input.faqs ? input.faqs.map(f => ({ q: f.question, a: f.answer })) : []);
  const seoTitle = generateSeoTitle(input.title, input.seoTitle);
  const metaDescription = generateMetaDescription(input.shortDesc, input.metaDescription);
  const keywords = enrichToolKeywords(input.keywords);

  return {
    ...input,
    id: input.slug,
    name: input.title,
    engineType: input.engineType || "native",
    isWasm: input.engineType === "wasm",
    trending: input.trending ?? false,
    status: "live",
    indexable: true,
    cpcTier: input.cpcTier || "medium",
    region: input.region || "GLOBAL",
    seoTitle,
    metaDescription,
    keywords,
    formulaExplanation:
      input.formulaExplanation ||
      `This tool calculates results 100% inside your browser using client-side JavaScript. Enter your values to inspect exact calculations.`,
    workedExamples: input.workedExamples || [
      {
        title: "Standard Scenario",
        inputSummary: "Default starting parameters",
        resultSummary: "Accurate real-time calculated breakdown",
      },
      {
        title: "High-Volume Scenario",
        inputSummary: "Scaled input parameters",
        resultSummary: "Instant recomputed metrics",
      },
    ],
    faqs,
    faq,
    relatedSlugs: input.relatedSlugs || [],
  };
}

const TIER1_TOOLS: ToolDefinition[] = [
  define({
    slug: "us-1099-tax-calculator",
    title: "US 1099 Freelance Tax Estimator",
    shortDesc: "Estimate 15.3% self-employment tax, federal income tax, QBI deduction, and state taxes for all 50 states.",
    category: "finance",
    group: "Tax, Salary & Banking Calculators",
    componentKey: "tax-1099-calculator",
    cpcTier: "high",
    region: "US",
    trending: true,
    seoTitle: "1099 Tax Calculator: US Self-Employment & State Tax",
    metaDescription: "Calculate 2025-2026 US 1099 self-employment tax, federal brackets, QBI deduction, and all 50 state taxes. Free, no signup required.",
    keywords: ["1099 tax", "self employment tax", "freelance tax", "quarterly estimated taxes", "qbi deduction"],
    formulaExplanation: "Self-Employment (SE) tax is 15.3% on 92.35% of net freelance earnings. 50% of SE tax is deducted from Adjusted Gross Income (AGI). The Qualified Business Income (QBI) Section 199A deduction deducts up to 20% of net income, followed by the federal standard deduction ($15,000 Single / $30,000 Married) and state tax brackets.",
    workedExamples: [
      {
        title: "Freelance Designer in Texas ($95,000 Gross)",
        inputSummary: "Gross: $95,000 · Expenses: $12,000 · State: TX (No State Tax)",
        resultSummary: "Net: $83,000 · SE Tax: $11,727 · Federal Tax: $6,081 · Total Tax: $17,808 (21.5% effective rate)",
      },
      {
        title: "Software Consultant in California ($150,000 Gross)",
        inputSummary: "Gross: $150,000 · Expenses: $20,000 · State: CA",
        resultSummary: "Net: $130,000 · SE Tax: $17,212 · Fed Tax: $15,824 · State Tax: $8,754 · Total: $41,790 (32.1% effective)",
      },
    ],
    faqs: [
      { question: "How is self-employment tax calculated?", answer: "SE tax is 15.3% (12.4% Social Security up to $176,100 + 2.9% Medicare uncapped) applied to 92.35% of your net business profit." },
      { question: "What is the 20% QBI deduction?", answer: "The Qualified Business Income deduction allows eligible pass-through freelancers and sole proprietors to deduct up to 20% of their net qualified business income from federal income taxes." },
      { question: "When are 1099 quarterly taxes due?", answer: "Estimated quarterly payments are due on April 15, June 15, September 15, and January 15." },
      { question: "Are my earnings kept private?", answer: "Yes. All income and expense calculations run 100% inside your browser's tab memory. Zero data is sent to any server." },
    ],
    relatedSlugs: ["401k-retirement-calculator", "debt-payoff-calculator", "freelance-nda-generator", "invoice-pdf-generator"],
  }),
  define({
    slug: "mortgage-calculator",
    title: "US Mortgage + PMI + Property Tax Calculator",
    shortDesc: "Calculate fixed-rate monthly mortgage payments (PITI) with PMI auto-cancellation and full CSV schedule export.",
    category: "real-estate",
    group: "Insurance & Real Estate Estimators",
    componentKey: "mortgage-calculator",
    cpcTier: "high",
    region: "US",
    trending: true,
    seoTitle: "Mortgage Calculator with PMI & Property Tax",
    metaDescription: "Calculate monthly mortgage payments (PITI), automatic 80% LTV PMI cancellation, and download full CSV amortization schedules free.",
    keywords: ["mortgage calculator", "pmi calculator", "piti calculator", "amortization schedule", "home loan"],
    formulaExplanation: "Monthly principal and interest uses M = P[r(1+r)^n]/[(1+r)^n - 1]. Property taxes and homeowner insurance are divided over 12 months. When loan-to-value (LTV) is greater than 80%, Private Mortgage Insurance (PMI) is applied until home equity reaches 20%.",
    workedExamples: [
      {
        title: "US Median Home with 10% Down ($425,000 Price)",
        inputSummary: "$425,000 Price · 10% ($42,500) Down · 6.85% Rate · 30 Years",
        resultSummary: "$2,507 P&I · $425 Tax · $125 Ins · $271 PMI · Total: $3,328/mo. PMI drops at Month 104.",
      },
      {
        title: "20% Down Conventional ($600,000 Price)",
        inputSummary: "$600,000 Price · 20% ($120,000) Down · 6.50% Rate · 30 Years",
        resultSummary: "$3,034 P&I · $600 Tax · $150 Ins · $0 PMI · Total: $3,784/mo. Zero PMI required.",
      },
    ],
    faqs: [
      { question: "When does PMI drop off automatically?", answer: "Under the Homeowners Protection Act, borrowers can request PMI cancellation at 80% LTV and lenders must automatically terminate it at 78% LTV based on the original purchase price." },
      { question: "Can I export the full amortization schedule?", answer: "Yes, click 'Export CSV Amortization' to download a complete month-by-month spreadsheet of principal, interest, PMI, and remaining balances." },
      { question: "What is PITI?", answer: "PITI stands for Principal, Interest, Taxes, and Insurance—the four core components of a total monthly housing payment." },
      { question: "Does this require a credit check?", answer: "No. This is a private browser calculator without loan applications or lender credit checks." },
    ],
    relatedSlugs: ["rent-vs-buy", "rental-roi-calculator", "auto-refinance-calculator"],
  }),
  define({
    slug: "rent-vs-buy",
    title: "Rent vs. Buy Break-Even Calculator",
    shortDesc: "Determine the exact financial break-even year between renting and buying a home, factoring in appreciation and opportunity cost.",
    category: "real-estate",
    group: "Insurance & Real Estate Estimators",
    componentKey: "rent-vs-buy",
    cpcTier: "high",
    region: "US",
    trending: true,
    seoTitle: "Rent vs Buy Calculator: Accurate Financial Break-Even",
    metaDescription: "Calculate the exact financial break-even year between renting and buying a home. Accounts for down payment opportunity cost, rent inflation, and home equity.",
    keywords: ["rent vs buy", "should i buy a house", "homeownership break even", "renting vs buying"],
    formulaExplanation: "Compares the buyer's net wealth (home equity minus 6% selling costs, maintenance, and mortgage interest) against the renter's net wealth (down payment and monthly savings invested at a compound annual return minus inflating rent).",
    workedExamples: [
      {
        title: "Suburban Home vs Apartment ($450,000 vs $2,400 Rent)",
        inputSummary: "$450,000 Home · 20% Down · 6.75% Rate · $2,400 Rent · 7% Stock Return",
        resultSummary: "Break-even occurs in Year 5. By Year 10, buying generates $64,000 more net wealth than renting.",
      },
      {
        title: "High-Cost Urban Condo ($850,000 vs $3,200 Rent)",
        inputSummary: "$850,000 Condo · 20% Down · 7.0% Rate · $3,200 Rent · 8% Stock Return",
        resultSummary: "Renting remains ahead for 12 years due to high mortgage interest and investment compounding.",
      },
    ],
    faqs: [
      { question: "What is the 5% rule in real estate?", answer: "The 5% rule estimates unrecoverable costs of homeownership: 1% property tax, 1% maintenance, and 3% cost of debt capital." },
      { question: "How does the stock market opportunity cost affect the decision?", answer: "Investing the down payment in broad market index funds (e.g. S&P 500 at 7-8%) can often outpace home equity in early years." },
      { question: "Does the calculator factor in selling costs?", answer: "Yes, it models a standard 6% real estate broker commission upon eventual home sale." },
      { question: "Are inflation rates customizable?", answer: "Yes, you can independently adjust expected home appreciation, rent inflation, and stock return rates." },
    ],
    relatedSlugs: ["mortgage-calculator", "rental-roi-calculator", "us-1099-tax-calculator"],
  }),
  define({
    slug: "life-insurance-calculator",
    title: "Life Insurance Coverage Needs (DIME)",
    shortDesc: "Calculate your family's exact term life insurance coverage requirement using the industry-standard DIME formula.",
    category: "insurance",
    group: "Insurance & Real Estate Estimators",
    componentKey: "life-insurance-calculator",
    cpcTier: "high",
    region: "US",
    trending: true,
    seoTitle: "Life Insurance Calculator: DIME Method Coverage Needs",
    metaDescription: "Calculate exact term life insurance needs using the DIME formula (Debt, Income, Mortgage, Education). Private, no sales calls or agent forms.",
    keywords: ["life insurance calculator", "dime formula", "how much life insurance", "term life coverage"],
    formulaExplanation: "Total Coverage = Debt (consumer/auto loans) + Income Replacement (Annual Income × Years) + Mortgage Payoff + Education Funding (College Target × Children) - Existing Liquid Assets.",
    workedExamples: [
      {
        title: "Family with 2 Young Children ($90,000 Income)",
        inputSummary: "$25,000 Debt · $90,000 Income (10 yrs) · $320,000 Mortgage · 2 Kids ($100k college) · $95,000 Assets",
        resultSummary: "$1,445,000 Gross Needs - $95,000 Assets = $1,350,000 Recommended Term Life Coverage.",
      },
      {
        title: "Dual Income No Dependents ($120,000 Income)",
        inputSummary: "$10,000 Debt · $120,000 Income (5 yrs) · $200,000 Mortgage · 0 Kids · $150,000 Assets",
        resultSummary: "$810,000 Gross Needs - $150,000 Assets = $660,000 Recommended Term Life Coverage.",
      },
    ],
    faqs: [
      { question: "What does DIME stand for?", answer: "DIME stands for Debt, Income replacement, Mortgage balance, and Education funds for children." },
      { question: "How many years of income should I replace?", answer: "Financial planners typically recommend 7 to 10 years of income replacement for parents of minor children." },
      { question: "Will insurance companies contact me?", answer: "No. There are no forms, phone numbers, or insurance agent networks. Calculations are 100% private." },
      { question: "Should I include employer group life insurance?", answer: "Employer policies are rarely portable if you change jobs; counting them as a secondary buffer rather than primary coverage is recommended." },
    ],
    relatedSlugs: ["auto-refinance-calculator", "mortgage-calculator", "401k-retirement-calculator"],
  }),
  define({
    slug: "stripe-fee-calculator",
    title: "Stripe & PayPal Fee Reverse-Net Calculator",
    shortDesc: "Calculate payment processor fees and the exact gross amount to bill a client to receive your target net payout.",
    category: "business",
    group: "B2B SaaS, E-Commerce & Marketing ROI",
    componentKey: "stripe-fee-calculator",
    cpcTier: "high",
    region: "GLOBAL",
    trending: true,
    seoTitle: "Stripe & PayPal Fee Calculator: Reverse Net Payout",
    metaDescription: "Calculate Stripe, PayPal, and Shopify merchant fees. Use Reverse Net mode to find the exact invoice amount to bill clients. Free online tool.",
    keywords: ["stripe fee calculator", "paypal fee calculator", "reverse fee calculator", "credit card processing fee"],
    formulaExplanation: "Forward: Fee = (Amount × Rate) + Fixed. Reverse: Gross Invoice = (Target Net + Fixed Fee) ÷ (1 - Percentage Rate).",
    workedExamples: [
      {
        title: "Invoice $1,000 Net Payout via Stripe (2.9% + $0.30)",
        inputSummary: "Target Net: $1,000 · Rate: 2.9% + $0.30",
        resultSummary: "Bill Client: $1,030.18 · Stripe Fee: $30.18 · Net Received: Exactly $1,000.00",
      },
      {
        title: "Deducting Fees on $500 Payment via PayPal (3.49% + $0.49)",
        inputSummary: "Customer Pays: $500 · Rate: 3.49% + $0.49",
        resultSummary: "PayPal Fee: $17.94 · Net Deposited to Bank: $482.06",
      },
    ],
    faqs: [
      { question: "How does reverse fee billing work?", answer: "Instead of losing margin to processing fees, the reverse formula calculates the exact amount to invoice so after Stripe or PayPal deducts their fee, you receive your exact net quote." },
      { question: "What is Stripe's standard US processing fee?", answer: "Stripe standard US pricing is 2.9% + $0.30 per successful card charge." },
      { question: "Are international card fees higher?", answer: "Yes, international cards and currency conversions typically incur an additional 1% to 1.5% fee." },
      { question: "Does this support custom processor rates?", answer: "Yes, you can edit the percentage and fixed fee values to match any merchant account agreement." },
    ],
    relatedSlugs: ["invoice-pdf-generator", "saas-metrics-calculator", "us-1099-tax-calculator"],
  }),
  define({
    slug: "amazon-fba-calculator",
    title: "Amazon FBA Profit & Margin Calculator",
    shortDesc: "Estimate Amazon FBA fulfillment fees, 15% referral fees, PPC ACoS, and true net profit margin per unit.",
    category: "business",
    group: "B2B SaaS, E-Commerce & Marketing ROI",
    componentKey: "amazon-fba-calculator",
    cpcTier: "high",
    region: "US",
    trending: true,
    seoTitle: "Amazon FBA Calculator: Net Profit Margin & Fees",
    metaDescription: "Calculate Amazon FBA fulfillment size tier fees, referral costs, PPC ad spend, and net ROI per unit. Accurate 2025-2026 e-commerce calculator.",
    keywords: ["amazon fba calculator", "fba profit calculator", "fba fee estimator", "amazon seller margin"],
    formulaExplanation: "Net Profit = Retail Price - (Landed COGS + Referral Fee + FBA Size Tier Fee + PPC Cost per Unit + Return Reserves). Net Margin = (Net Profit ÷ Retail Price) × 100.",
    workedExamples: [
      {
        title: "Private Label Kitchen Tool ($34.99 Retail)",
        inputSummary: "$34.99 Price · $8.50 COGS · 15% Referral · Large 1lb FBA ($3.86) · 12% PPC · 3% Returns",
        resultSummary: "Total Amazon Take: $9.11 · Total Cost: $22.86 · Net Profit: $12.13 (34.7% margin, 142.7% ROI)",
      },
      {
        title: "Standard Apparel Item ($49.99 Retail)",
        inputSummary: "$49.99 Price · $14.00 COGS · 17% Referral · Large 2lb FBA ($4.75) · 15% PPC",
        resultSummary: "Total Amazon Take: $13.25 · Net Profit: $15.24 (30.5% margin, 108.9% ROI)",
      },
    ],
    faqs: [
      { question: "What is Amazon's referral fee?", answer: "Amazon charges a referral fee on each item sold, typically 15% across most categories (ranging from 8% to 45%)." },
      { question: "How are FBA fulfillment fees determined?", answer: "FBA fees are based on the shipping weight and dimensional size tier (Small Standard, Large Standard, Oversize) of the packaged unit." },
      { question: "What is a healthy target ACoS for Amazon PPC?", answer: "A break-even ACoS equals your pre-ad profit margin. Most sellers target a 10% to 20% ACoS for profitable growth." },
      { question: "Does this include returns and storage?", answer: "Yes, you can configure a reserve percentage for customer returns, damaged inventory, and monthly storage." },
    ],
    relatedSlugs: ["roas-cpa-calculator", "stripe-fee-calculator", "saas-metrics-calculator"],
  }),
  define({
    slug: "saas-metrics-calculator",
    title: "SaaS LTV, CAC & Burn Runway Calculator",
    shortDesc: "Calculate ARPA, Customer Lifetime Value (LTV), blended CAC, CAC payback period, and monthly cash burn runway.",
    category: "business",
    group: "B2B SaaS, E-Commerce & Marketing ROI",
    componentKey: "saas-metrics-calculator",
    cpcTier: "high",
    region: "GLOBAL",
    trending: true,
    seoTitle: "SaaS Metrics Calculator: LTV, CAC & Cash Runway",
    metaDescription: "Calculate customer lifetime value (LTV), blended CAC, payback period in months, and cash burn runway. Essential unit economics calculator for founders.",
    keywords: ["saas metrics calculator", "ltv cac calculator", "cac payback period", "cash runway calculator"],
    formulaExplanation: "ARPA = MRR ÷ Customers. LTV = (ARPA × Gross Margin) ÷ Monthly Churn. CAC = S&M Spend ÷ New Customers. CAC Payback = CAC ÷ (ARPA × Gross Margin). Runway = Cash ÷ Net Monthly Burn.",
    workedExamples: [
      {
        title: "B2B SaaS Seed Stage ($45,000 MRR)",
        inputSummary: "$45,000 MRR · 300 Customers · 2.5% Churn · 82% Margin · $15,000 S&M · 35 New Users · $350k Cash",
        resultSummary: "LTV: $4,920 · CAC: $429 · LTV:CAC: 11.5x · Payback: 3.5 Months · Runway: 12.5 Months",
      },
      {
        title: "Growth Stage SaaS ($150,000 MRR)",
        inputSummary: "$150,000 MRR · 1,200 Customers · 3.5% Churn · 78% Margin · $60,000 S&M · 110 New Users · $1.2M Cash",
        resultSummary: "LTV: $2,786 · CAC: $545 · LTV:CAC: 5.1x · Payback: 5.6 Months · Runway: 18.2 Months",
      },
    ],
    faqs: [
      { question: "What is an ideal SaaS LTV:CAC ratio?", answer: "A healthy SaaS benchmark is 3:1 or higher. Ratios below 3:1 signal inefficient acquisition, while ratios above 5:1 suggest you can afford to invest more aggressively in marketing." },
      { question: "What is an acceptable CAC payback period?", answer: "For SMB SaaS, a payback under 12 months is standard. Enterprise contracts can tolerate 18 to 24 months." },
      { question: "How does churn rate affect customer lifetime value?", answer: "LTV is inversely proportional to churn. Cutting monthly churn from 4% to 2% doubles customer lifetime value." },
      { question: "Are my company financials stored?", answer: "No. All SaaS formulas evaluate locally in browser memory without sending data to any analytics service." },
    ],
    relatedSlugs: ["roas-cpa-calculator", "stripe-fee-calculator", "us-1099-tax-calculator"],
  }),
  define({
    slug: "roas-cpa-calculator",
    title: "Google Ads ROAS & Break-Even CPA Calculator",
    shortDesc: "Calculate Return on Ad Spend (ROAS), break-even conversion multipliers, and maximum profitable acquisition cost (CPA).",
    category: "marketing",
    group: "Advertising & Marketing ROI",
    componentKey: "roas-cpa-calculator",
    cpcTier: "high",
    region: "GLOBAL",
    trending: true,
    seoTitle: "Google Ads ROAS & Break-Even CPA Calculator",
    metaDescription: "Calculate campaign ROAS, break-even target CPA, and net profit from digital ad spend. Free marketing ROI calculator for Google & Meta Ads.",
    keywords: ["roas calculator", "break even cpa", "google ads roi", "target cpa calculator"],
    formulaExplanation: "ROAS = Gross Revenue ÷ Ad Spend. Break-Even ROAS = 1 ÷ Gross Margin. Max Target CPA = Average Order Value (AOV) × Gross Margin. Net Profit = (Revenue × Gross Margin) - Ad Spend.",
    workedExamples: [
      {
        title: "E-Commerce Apparel Campaign ($5,000 Ad Spend)",
        inputSummary: "$5,000 Spend · $2.25 CPC · 3.2% Conv Rate · $110 AOV · 65% Product Margin",
        resultSummary: "71 Orders · $7,822 Revenue · 1.56x ROAS · Actual CPA: $70.30 · Max CPA: $71.50 (Profitable)",
      },
      {
        title: "High-Margin Software Lead Gen ($10,000 Ad Spend)",
        inputSummary: "$10,000 Spend · $6.50 CPC · 4.5% Conv Rate · $450 AOV · 85% Gross Margin",
        resultSummary: "69 Orders · $31,154 Revenue · 3.12x ROAS · Break-Even ROAS: 1.18x · Net Profit: $16,481",
      },
    ],
    faqs: [
      { question: "What is break-even ROAS?", answer: "Break-even ROAS is the minimum return on ad spend required so revenue covers both advertising and product delivery costs. At 50% margin, break-even ROAS is 2.0x." },
      { question: "What is the difference between ROAS and ROI?", answer: "ROAS measures gross revenue per dollar spent on ads. ROI accounts for total costs (COGS, shipping, payment processing) to measure true bottom-line gain." },
      { question: "How do I calculate maximum target CPA?", answer: "Max CPA = AOV × Gross Margin. Bidding higher than this number results in net loss on initial acquisition." },
      { question: "Can I use this for Meta and TikTok ads?", answer: "Yes, the mathematical relationship between clicks, conversion rates, order values, and margins applies to any performance marketing channel." },
    ],
    relatedSlugs: ["adsense-rpm-calculator", "amazon-fba-calculator", "saas-metrics-calculator"],
  }),
  define({
    slug: "privacy-policy-generator",
    title: "GDPR & CCPA Privacy Policy Generator",
    shortDesc: "Generate legally formatted privacy policies compliant with GDPR, CCPA/CPRA, and cookie disclosures. Export clean Markdown and HTML.",
    category: "legal",
    group: "Legal, Compliance & Privacy Generators",
    componentKey: "privacy-policy-generator",
    cpcTier: "high",
    region: "GLOBAL",
    trending: true,
    seoTitle: "Free GDPR & CCPA Privacy Policy Generator",
    metaDescription: "Generate customized GDPR and CCPA compliant website privacy policies with cookie disclosures. Export clean HTML and Markdown free without signup.",
    keywords: ["privacy policy generator", "gdpr privacy policy", "ccpa compliance generator", "website privacy policy"],
    formulaExplanation: "Compiles standard legal clauses covering data collection, cookies, third-party analytics (Google Analytics, Meta Pixel), payment processors, and statutory consumer rights (access, erasure, non-discrimination).",
    workedExamples: [
      {
        title: "E-Commerce Store with Analytics & Ads",
        inputSummary: "Acme Store · GDPR + CCPA enabled · Analytics & Payment Processing",
        resultSummary: "Full compliant policy with Section 4 GDPR Data Rights and Section 5 CCPA Consumer Rights in Markdown & HTML.",
      },
      {
        title: "B2B SaaS Application",
        inputSummary: "CloudApp Inc · EU/UK customer base · Direct payment integration",
        resultSummary: "Comprehensive disclosure including data portability, security measures, and DPO contact details.",
      },
    ],
    faqs: [
      { question: "Is a privacy policy legally required?", answer: "Yes, laws including GDPR (EU/UK), CCPA/CPRA (California), and CalOPPA require websites collecting any personal data (including IP addresses and cookies) to post a clear privacy policy." },
      { question: "Does this policy cover Google Analytics and cookies?", answer: "Yes, the generator includes dedicated clauses disclosing analytics cookies, advertising partners, and how visitors can opt out." },
      { question: "Can I export in Markdown and HTML?", answer: "Yes, you can toggle between formatted Markdown (.md) and semantic HTML (.html) with one-click copy and file download." },
      { question: "Are my company details saved on your server?", answer: "No. The policy is generated entirely client-side in your browser's JavaScript environment. Zero data is retained." },
    ],
    relatedSlugs: ["invoice-pdf-generator", "freelance-nda-generator", "wcag-contrast-checker"],
  }),
  define({
    slug: "invoice-pdf-generator",
    title: "Client Invoice-to-PDF Builder",
    shortDesc: "Create professional vector PDF invoices with line items, multi-currency support, and instant client-side download.",
    category: "legal",
    group: "Legal, Compliance & Privacy Generators",
    componentKey: "invoice-pdf-generator",
    cpcTier: "high",
    region: "GLOBAL",
    trending: true,
    seoTitle: "Free Invoice to PDF Generator (In-Browser)",
    metaDescription: "Create clean, professional PDF invoices with multi-currency (USD, GBP, EUR, CAD, AUD) support and tax calculations. Instant vector PDF download, zero signup.",
    keywords: ["invoice generator", "pdf invoice builder", "freelance invoice maker", "free online invoice"],
    formulaExplanation: "Compiles vector PDF invoices using pdf-lib directly in your browser. Automatically calculates line item totals, tax percentages, and formatted currency sums.",
    workedExamples: [
      {
        title: "Web Development Invoice (USD)",
        inputSummary: "40 hrs @ $125/hr + 20 hrs @ $110/hr · 0% Tax · Due in 14 days",
        resultSummary: "Generates high-resolution vector A4 PDF with itemized table and $7,200 total due.",
      },
      {
        title: "Consulting Retainer (GBP / VAT)",
        inputSummary: "Monthly Retainer (£3,500) · 20% VAT · Net Due: £4,200",
        resultSummary: "Formatted UK invoice with VAT breakdown and bank payment terms.",
      },
    ],
    faqs: [
      { question: "Which currencies are supported?", answer: "Supports USD ($), GBP (£), EUR (€), CAD ($), and AUD ($) with localized currency symbols." },
      { question: "Are my client details or invoices stored?", answer: "No. The invoice is compiled into a PDF binary entirely within your browser tab. No financial records or client details leave your device." },
      { question: "What is the output format?", answer: "Standard vector PDF (A4 dimensions, 595 × 842 pt) suitable for high-resolution printing or email attachment." },
      { question: "Can I add multiple line items?", answer: "Yes, you can dynamically add, edit, or remove as many service items and expense lines as needed." },
    ],
    relatedSlugs: ["stripe-fee-calculator", "freelance-nda-generator", "us-1099-tax-calculator"],
  }),
  define({
    slug: "video-trimmer",
    title: "In-Browser Video Trimmer & Clip Cutter",
    shortDesc: "Cut and trim video clips locally in your browser using hardware-accelerated MediaStream APIs with zero file uploads.",
    category: "media",
    group: "Video, Audio & Media",
    componentKey: "video-trimmer",
    cpcTier: "medium",
    region: "GLOBAL",
    trending: true,
    seoTitle: "Video Trimmer: Cut Videos Online Privately",
    metaDescription: "Trim, cut, and slice MP4 and WebM videos directly in your browser. 100% private video processing with zero file uploads. Free, no watermark.",
    keywords: ["video trimmer", "cut video online", "trim mp4 in browser", "private video cutter"],
    formulaExplanation: "Uses HTML5 Video and the MediaStream/MediaRecorder API to play back and record exact selected time segments without server uploads.",
    workedExamples: [
      {
        title: "Trim Social Media Clip (15 seconds)",
        inputSummary: "60-second MP4 video · Cut from 0:10 to 0:25",
        resultSummary: "Outputs high-quality trimmed WebM clip ready for instant download.",
      },
      {
        title: "Remove Intro and Outro",
        inputSummary: "2-minute demonstration recording · Cut out first 5s and last 8s",
        resultSummary: "Cleaned clip exported locally with zero loss of private footage.",
      },
    ],
    faqs: [
      { question: "Are my video files uploaded to a server?", answer: "No. The video is read into browser memory and captured locally via HTML5 MediaStream. Your footage never leaves your computer." },
      { question: "Which video formats can I trim?", answer: "Supports any video format your browser can play, including MP4, WebM, and MOV." },
      { question: "Is there a watermark on the exported video?", answer: "No. All exports are 100% watermark-free." },
      { question: "What is the maximum file size?", answer: "We recommend files under 250 MB for smooth in-browser recording performance." },
    ],
    relatedSlugs: ["youtube-toolkit", "word-counter", "background-remover"],
  }),
  define({
    slug: "uk-take-home-pay",
    title: "UK PAYE Take-Home Pay & Tax Calculator",
    shortDesc: "Calculate UK take-home pay after Income Tax bands, 8% National Insurance Class 1, and Student Loan plans.",
    category: "finance",
    group: "Tax, Salary & Banking Calculators",
    componentKey: "uk-take-home-pay",
    cpcTier: "high",
    region: "UK",
    trending: true,
    seoTitle: "UK Take-Home Pay Calculator 2025-2026 (PAYE & NI)",
    metaDescription: "Calculate UK take-home salary after HMRC Income Tax, National Insurance Class 1, and Student Loan deductions. Updated 2025-2026 rates, free online tool.",
    keywords: ["uk take home pay", "uk salary calculator", "paye calculator", "national insurance calculator"],
    formulaExplanation: "Applies HMRC 2025-2026 personal allowance (£12,570), 20% basic band, 40% higher band, 45% additional band, 8% National Insurance Class 1, and Student Loan repayment thresholds.",
    workedExamples: [
      {
        title: "UK Average Professional Salary (£45,000)",
        inputSummary: "£45,000 Gross · Plan 2 Student Loan · 5% Workplace Pension",
        resultSummary: "Net Take-Home: £33,391/year (£2,783/month) · Income Tax: £6,036 · NI: £2,594 · Student Loan: £1,593",
      },
      {
        title: "Higher Rate Taxpayer (£75,000)",
        inputSummary: "£75,000 Gross · No Student Loan · 5% Pension",
        resultSummary: "Net Take-Home: £51,845/year (£4,320/month) · Income Tax: £15,649 · NI: £3,514",
      },
    ],
    faqs: [
      { question: "What is the UK Personal Allowance for 2025-2026?", answer: "The standard personal allowance is £12,570, which tapers by £1 for every £2 of income above £100,000." },
      { question: "What are the current National Insurance rates?", answer: "Class 1 employee National Insurance is 8% on earnings between £12,570 and £50,270, and 2% on earnings above £50,270." },
      { question: "Which Student Loan plans are supported?", answer: "Includes Plan 1 (£24,990 threshold), Plan 2 (£27,295 threshold), Plan 4 Scotland (£31,395 threshold), and Postgraduate loans." },
      { question: "Does this calculate pension contributions?", answer: "Yes, you can configure salary sacrifice workplace pension percentages." },
    ],
    relatedSlugs: ["us-1099-tax-calculator", "canada-gst-hst-calculator", "debt-payoff-calculator"],
  }),
  define({
    slug: "canada-gst-hst-calculator",
    title: "Canada GST/HST & Provincial Sales Tax",
    shortDesc: "Add or reverse-extract Canadian sales taxes (GST, PST, QST, HST) across all 10 provinces and 3 territories.",
    category: "finance",
    group: "Tax, Salary & Banking Calculators",
    componentKey: "canada-gst-hst-calculator",
    cpcTier: "high",
    region: "CA",
    trending: true,
    seoTitle: "Canada GST/HST Calculator: All Provinces & Reverse Tax",
    metaDescription: "Calculate Canadian sales tax for all provinces (Ontario 13% HST, BC 12%, Alberta 5% GST, Quebec 14.975%). Reverse tax extraction mode included free.",
    keywords: ["canada gst calculator", "hst calculator", "canadian sales tax", "reverse gst calculator"],
    formulaExplanation: "Calculates provincial sales tax rates: Ontario 13% HST, British Columbia 5% GST + 7% PST, Alberta 5% GST, Quebec 5% GST + 9.975% QST, Atlantic provinces 15% HST. Reverse mode extracts pre-tax base using Net = Gross ÷ (1 + Tax Rate).",
    workedExamples: [
      {
        title: "Ontario Purchase ($100 Pre-Tax)",
        inputSummary: "$100.00 CAD · Ontario (13% HST) · Add Tax",
        resultSummary: "HST: $13.00 · Total Gross Price: $113.00 CAD",
      },
      {
        title: "Reverse Tax Extraction in Quebec ($500 Gross Total)",
        inputSummary: "$500.00 CAD Gross · Quebec (14.975% GST+QST) · Extract Mode",
        resultSummary: "Pre-Tax Base: $434.88 · Tax Extracted: $65.12 CAD",
      },
    ],
    faqs: [
      { question: "Which Canadian provinces have HST?", answer: "Ontario (13%), New Brunswick (15%), Newfoundland (15%), Nova Scotia (15%), and Prince Edward Island (15%) use Harmonized Sales Tax (HST)." },
      { question: "How does reverse tax extraction work?", answer: "Divide the gross total by (1 + tax rate) to find the original pre-tax amount and exact tax portion." },
      { question: "What is Alberta's sales tax rate?", answer: "Alberta has no provincial sales tax; only the 5% federal GST applies." },
      { question: "Does Quebec charge tax on tax?", answer: "No, Quebec QST (9.975%) and federal GST (5%) are both calculated directly on the base selling price (total effective rate 14.975%)." },
    ],
    relatedSlugs: ["us-1099-tax-calculator", "uk-take-home-pay", "stripe-fee-calculator"],
  }),
  define({
    slug: "401k-retirement-calculator",
    title: "US 401(k) & Roth IRA Compounding Growth",
    shortDesc: "Project retirement nest egg balances factoring in employer matching, 2025 contribution limits, and inflation purchasing power.",
    category: "finance",
    group: "Tax, Salary & Banking Calculators",
    componentKey: "401k-retirement-calculator",
    cpcTier: "high",
    region: "US",
    trending: true,
    seoTitle: "401k Calculator with Employer Match & Inflation",
    metaDescription: "Calculate 401(k) and Roth IRA retirement compounding growth with employer match and inflation-adjusted purchasing power. Free, private online tool.",
    keywords: ["401k calculator", "retirement growth calculator", "401k match calculator", "roth ira compound calculator"],
    formulaExplanation: "Compounds annual employee deferrals (up to $23,500 IRS 2025 limit) plus employer matching at expected investment return rate r. Inflation-adjusted purchasing power is discounted using (1 + inflation)^years.",
    workedExamples: [
      {
        title: "30-Year-Old Contributing 10% with 4% Match ($95,000 Salary)",
        inputSummary: "Age 30 to 65 · $50,000 starting · $9,500 employee + $3,800 match · 7.5% return",
        resultSummary: "Projected Age 65 Balance: $2,580,000 · Inflation-Adjusted: $1,087,000 in today's purchasing power.",
      },
      {
        title: "Maxing Out 401(k) Over 25 Years ($23,500/yr)",
        inputSummary: "Age 40 to 65 · $100,000 starting · $23,500 annual contribution · 8% return",
        resultSummary: "Projected Age 65 Balance: $2,423,000.",
      },
    ],
    faqs: [
      { question: "What is the 2025 IRS 401(k) contribution limit?", answer: "The 2025 employee elective deferral limit is $23,500 (with an additional $7,500 catch-up contribution for workers age 50 and older)." },
      { question: "How does the employer match work?", answer: "Employers typically match a percentage of salary (e.g. 50% on up to 6% of salary), providing an immediate 50% guaranteed return on those contributions." },
      { question: "Why is inflation adjustment important?", answer: "A $2 million balance in 35 years has the purchasing power of roughly $850,000 today at a 2.5% inflation rate." },
      { question: "Is Roth IRA or Traditional 401(k) better?", answer: "Traditional 401(k) contributions reduce taxable income today; Roth IRA contributions grow tax-free and withdrawals in retirement are 100% tax-free." },
    ],
    relatedSlugs: ["us-1099-tax-calculator", "debt-payoff-calculator", "mortgage-calculator"],
  }),
  define({
    slug: "debt-payoff-calculator",
    title: "Debt Snowball vs. Avalanche Payoff Calculator",
    shortDesc: "Compare debt snowball and debt avalanche strategies to eliminate credit cards and personal loans with interest savings.",
    category: "finance",
    group: "Tax, Salary & Banking Calculators",
    componentKey: "debt-payoff-calculator",
    cpcTier: "high",
    region: "US",
    trending: true,
    seoTitle: "Debt Payoff Calculator: Snowball vs Avalanche",
    metaDescription: "Compare Debt Avalanche (highest APR first) vs Debt Snowball (lowest balance first). Calculate payoff dates and total interest saved free.",
    keywords: ["debt payoff calculator", "debt avalanche calculator", "debt snowball calculator", "credit card payoff"],
    formulaExplanation: "Avalanche targets the debt with the highest annual percentage rate (APR) to minimize lifetime interest. Snowball targets the smallest balance first for psychological motivation.",
    workedExamples: [
      {
        title: "Three Debts with $300 Extra Monthly ($36,500 Total)",
        inputSummary: "$6,500 @ 24.99% · $12,000 @ 11.5% · $18,000 @ 6.9% · $300 extra/mo",
        resultSummary: "Debt-free in 38 months. Avalanche strategy saves $3,800+ in interest compared to minimum payments.",
      },
    ],
    faqs: [
      { question: "Which is mathematically better: Snowball or Avalanche?", answer: "Debt Avalanche is mathematically optimal because paying off high-interest debts first saves the most total interest." },
      { question: "Why do some people prefer the Debt Snowball?", answer: "Quickly eliminating the smallest balance provides psychological encouragement and frees up cashflow earlier." },
      { question: "Are my debt balances stored?", answer: "No. All numbers remain in your browser's private memory." },
      { question: "How much extra should I pay toward debt?", answer: "Even an extra $50 to $100 per month significantly shortens repayment timelines on high-APR credit cards." },
    ],
    relatedSlugs: ["401k-retirement-calculator", "us-1099-tax-calculator", "auto-refinance-calculator"],
  }),
  define({
    slug: "rental-roi-calculator",
    title: "Rental & Airbnb Cash-on-Cash ROI Calculator",
    shortDesc: "Analyze investment property returns: Net Operating Income (NOI), Cap Rate, DSCR, and Cash-on-Cash Return.",
    category: "real-estate",
    group: "Insurance & Real Estate Estimators",
    componentKey: "rental-roi-calculator",
    cpcTier: "high",
    region: "US",
    trending: true,
    seoTitle: "Rental Property ROI & Cash-on-Cash Calculator",
    metaDescription: "Calculate Net Operating Income (NOI), Cap Rate, DSCR, and Cash-on-Cash return for long-term and Airbnb rental properties. Free online tool.",
    keywords: ["rental roi calculator", "cash on cash return", "cap rate calculator", "airbnb investment calculator"],
    formulaExplanation: "NOI = Effective Gross Income (Gross Rent - Vacancy) - Operating Expenses (Taxes, Insurance, Management, 1% Maintenance). Cash-on-Cash Return = (NOI - Annual Debt Service) ÷ Total Cash Invested.",
    workedExamples: [
      {
        title: "Single Family Rental ($350,000 Purchase)",
        inputSummary: "$350,000 Price · $70,000 Down · $3,200 Rent · $1,750 Mortgage · 10% Mgmt · 5% Vacancy",
        resultSummary: "Cap Rate: 7.2% · Net Cashflow: $485/month ($5,820/year) · Cash-on-Cash Return: 8.3%",
      },
    ],
    faqs: [
      { question: "What is a good Cash-on-Cash return for real estate?", answer: "Most investors target an 8% to 12% cash-on-cash return in residential real estate." },
      { question: "What is DSCR?", answer: "Debt Service Coverage Ratio (DSCR) equals NOI divided by annual mortgage payments. Lenders typically require a minimum DSCR of 1.20x to 1.25x." },
      { question: "How does Cap Rate differ from Cash-on-Cash return?", answer: "Cap Rate evaluates the property's unleveraged return as if purchased in cash; Cash-on-Cash measures the actual cash return on your down payment." },
      { question: "Does this include maintenance reserves?", answer: "Yes, it reserves 1% of property value annually for repairs and capital expenditures." },
    ],
    relatedSlugs: ["mortgage-calculator", "rent-vs-buy", "saas-metrics-calculator"],
  }),
  define({
    slug: "auto-refinance-calculator",
    title: "Auto Loan Refinance Savings Calculator",
    shortDesc: "Compare current vs. refinanced auto loan APR and term lengths to measure monthly payment drops and total interest savings.",
    category: "insurance",
    group: "Insurance & Real Estate Estimators",
    componentKey: "auto-refinance-calculator",
    cpcTier: "high",
    region: "US",
    trending: true,
    seoTitle: "Auto Loan Refinance Calculator: Monthly Savings",
    metaDescription: "Calculate monthly payment savings and total lifetime interest reduction by refinancing your car loan at a lower APR. Free online tool.",
    keywords: ["auto refinance calculator", "car loan refinance", "auto loan interest savings", "refinance car"],
    formulaExplanation: "Calculates monthly amortized payments for current loan versus new loan: Monthly Payment = P[r(1+r)^n]/[(1+r)^n - 1]. Total Interest Savings = Total Current Remaining Payments - Total New Payments.",
    workedExamples: [
      {
        title: "Refinancing $28,000 Auto Loan (8.9% down to 5.4%)",
        inputSummary: "$28,000 Balance · 48 Months Remaining · 8.9% Current APR down to 5.4% New APR",
        resultSummary: "Monthly Payment drops from $695 to $650 ($45/month savings) · Total Interest Saved: $2,180.",
      },
    ],
    faqs: [
      { question: "When does it make sense to refinance a car loan?", answer: "When market interest rates have dropped by at least 1-2%, or when your credit score has improved significantly since initial financing." },
      { question: "Can refinancing cost more overall?", answer: "Yes, if you extend the remaining loan term, you may lower monthly payments while paying more total interest over time." },
      { question: "Are there prepayment penalties on auto loans?", answer: "Most standard consumer auto loans do not have prepayment penalties, but check your agreement before refinancing." },
      { question: "Does this require a hard credit inquiry?", answer: "No. This tool is purely mathematical and runs in your browser without credit checks." },
    ],
    relatedSlugs: ["mortgage-calculator", "debt-payoff-calculator", "life-insurance-calculator"],
  }),
  define({
    slug: "adsense-rpm-calculator",
    title: "Google AdSense & Mediavine RPM Calculator",
    shortDesc: "Project monthly and annual display ad earnings based on pageviews, niche multipliers, and Tier-1 geographic traffic share.",
    category: "marketing",
    group: "Advertising & Marketing ROI",
    componentKey: "adsense-rpm-calculator",
    cpcTier: "high",
    region: "GLOBAL",
    trending: true,
    seoTitle: "AdSense & Mediavine RPM Calculator: Website Earnings",
    metaDescription: "Estimate website display ad revenue with Google AdSense, Mediavine, and Raptive. Factors in pageviews, niche CPC multipliers, and Tier-1 traffic ratios.",
    keywords: ["adsense rpm calculator", "mediavine revenue calculator", "website ad earnings", "cpm to rpm calculator"],
    formulaExplanation: "Estimated Earnings = (Monthly Pageviews ÷ 1,000) × Effective RPM. Effective RPM is scaled by niche CPM benchmarks (Finance $42+, Tech $24+, Lifestyle $18+) and Tier-1 traffic percentage.",
    workedExamples: [
      {
        title: "Finance Blog with 85,000 Views (75% Tier-1)",
        inputSummary: "85,000 Pageviews · Finance Niche ($42.50 Base RPM) · 75% US/UK Traffic",
        resultSummary: "Effective RPM: $33.47 · Projected Earnings: $2,845 / month ($34,140 / year) · Mediavine Ready",
      },
    ],
    faqs: [
      { question: "What is RPM in website advertising?", answer: "Revenue Per Mille (RPM) represents the estimated revenue earned per 1,000 pageviews across all ad units." },
      { question: "Why is Tier-1 traffic so important for ad revenue?", answer: "Advertisers pay up to 10x higher CPCs for users in the US, UK, Canada, and Australia due to high purchasing power." },
      { question: "What traffic is needed for Mediavine and Raptive?", answer: "Mediavine Journey requires 1,000 Tier-1 sessions, Mediavine core requires 50,000 sessions, and Raptive requires 25,000 pageviews with high Tier-1 mix." },
      { question: "Which website niches have the highest RPM?", answer: "Finance, Insurance, Real Estate, Legal, and B2B SaaS consistently generate the highest RPMs ($30-$80+)." },
    ],
    relatedSlugs: ["roas-cpa-calculator", "saas-metrics-calculator", "amazon-fba-calculator"],
  }),
  define({
    slug: "freelance-nda-generator",
    title: "Freelance NDA & Agreement Generator",
    shortDesc: "Generate bilateral non-disclosure agreements with customizable confidentiality terms. Instant client-side vector PDF download.",
    category: "legal",
    group: "Legal, Compliance & Privacy Generators",
    componentKey: "freelance-nda-generator",
    cpcTier: "high",
    region: "GLOBAL",
    trending: true,
    seoTitle: "Free Freelance NDA Generator (Download PDF)",
    metaDescription: "Generate standard freelance and contractor Non-Disclosure Agreements (NDAs). Customize confidentiality duration and download clean vector PDFs free.",
    keywords: ["freelance nda generator", "non disclosure agreement pdf", "contractor nda maker", "mutual nda"],
    formulaExplanation: "Assembles enforceable bilateral non-disclosure terms, defining confidential information, non-disclosure covenants, terms of duration, and governing jurisdiction into vector PDFs via pdf-lib.",
    workedExamples: [
      {
        title: "Independent Contractor NDA (Delaware Law)",
        inputSummary: "Disclosing: Acme Corp · Receiving: Jane Doe · 2 Years Term · Delaware Jurisdiction",
        resultSummary: "Instant vector PDF download with signature blocks and mutual non-disclosure clauses.",
      },
    ],
    faqs: [
      { question: "What is a mutual non-disclosure agreement?", answer: "A mutual NDA protects proprietary information shared by both parties during business or project discussions." },
      { question: "What is a standard confidentiality term?", answer: "Standard confidentiality duration for freelance and software engagements is 2 to 3 years from initial disclosure." },
      { question: "Is this generated document legally binding?", answer: "Yes, when signed by authorized representatives of both parties. However, consult an attorney for specialized intellectual property or international jurisdictions." },
      { question: "Are my agreement terms uploaded?", answer: "No. The document is compiled entirely inside your browser's PDF engine without cloud transmission." },
    ],
    relatedSlugs: ["invoice-pdf-generator", "privacy-policy-generator", "us-1099-tax-calculator"],
  }),
  define({
    slug: "wcag-contrast-checker",
    title: "WCAG 2.2 Contrast & ADA Audit Tool",
    shortDesc: "Calculate relative luminance and color contrast ratios against WCAG 2.2 AA and AAA standards for accessible web design.",
    category: "legal",
    group: "Legal, Compliance & Privacy Generators",
    componentKey: "wcag-contrast-checker",
    cpcTier: "high",
    region: "GLOBAL",
    trending: true,
    seoTitle: "WCAG 2.2 Color Contrast Checker (AA & AAA)",
    metaDescription: "Audit color contrast ratios against WCAG 2.2 AA and AAA standards. Test normal text, headings, and graphical components for ADA compliance.",
    keywords: ["wcag contrast checker", "color contrast ratio", "ada compliance tool", "web accessibility audit"],
    formulaExplanation: "Calculates relative luminance L = 0.2126R + 0.7152G + 0.0722B using sRGB gamma correction. Contrast ratio = (L1 + 0.05) ÷ (L2 + 0.05). Requires 4.5:1 for normal text and 3:1 for large text.",
    workedExamples: [
      {
        title: "Dark Slate on White (#1E293B on #FFFFFF)",
        inputSummary: "Text: #1E293B · Background: #FFFFFF",
        resultSummary: "Contrast Ratio: 12.63 : 1 · Passes WCAG 2.2 AA and AAA for all text sizes.",
      },
      {
        title: "Low Contrast Muted Gray (#94A3B8 on #FFFFFF)",
        inputSummary: "Text: #94A3B8 · Background: #FFFFFF",
        resultSummary: "Contrast Ratio: 2.58 : 1 · Fails WCAG AA. Suggested darker accessible shade provided.",
      },
    ],
    faqs: [
      { question: "What are the WCAG 2.2 AA contrast requirements?", answer: "Level AA requires a contrast ratio of at least 4.5:1 for normal text (< 18pt) and at least 3.0:1 for large text (>= 18pt or 14pt bold)." },
      { question: "What does Level AAA require?", answer: "Level AAA requires at least 7.0:1 for normal text and at least 4.5:1 for large typography." },
      { question: "Why is ADA compliance important for websites?", answer: "US courts frequently rule that commercial websites must comply with ADA Title III, using WCAG 2.1/2.2 AA as the legal standard." },
      { question: "Does contrast affect graphical UI components?", answer: "Yes, form borders, active states, and focus indicators require a minimum 3:1 contrast ratio against adjacent backgrounds." },
    ],
    relatedSlugs: ["privacy-policy-generator", "invoice-pdf-generator", "freelance-nda-generator"],
  }),
  define({
    slug: "local-pdf-redactor",
    title: "Local PDF Redactor (HIPAA & Legal Safe)",
    shortDesc: "Permanently blackout sensitive PDF text and strip hidden metadata 100% locally in browser memory without document uploads.",
    category: "legal",
    group: "Legal, Compliance & Privacy Generators",
    componentKey: "local-pdf-redactor",
    cpcTier: "high",
    region: "GLOBAL",
    trending: true,
    seoTitle: "Local PDF Redactor: HIPAA & Legal Safe Blackout",
    metaDescription: "Permanently redact and blackout sensitive PDF records locally in your browser. Strips hidden document metadata. 100% HIPAA and attorney safe.",
    keywords: ["pdf redactor", "redact pdf online", "hipaa safe pdf tool", "remove pdf metadata"],
    formulaExplanation: "Draws opaque vector blackout rectangles directly into the PDF content stream and permanently purges document dictionary metadata (Author, Subject, Producer, ModDate).",
    workedExamples: [
      {
        title: "Medical Record Redaction (Header Blackout + Metadata Strip)",
        inputSummary: "Patient record PDF · Strip all metadata + blackout top header area",
        resultSummary: "Outputs sanitized PDF with permanent blacked-out header and zero author/location metadata.",
      },
    ],
    faqs: [
      { question: "Are these redactions permanent?", answer: "Yes. The blackout boxes are embedded directly as solid opaque vector shapes in the PDF content stream, not transparent highlighters." },
      { question: "Does my document leave my computer?", answer: "No. All PDF processing executes 100% inside your browser using pdf-lib. Zero document bytes are uploaded across the internet." },
      { question: "Is this tool HIPAA and GDPR safe?", answer: "Yes, because no Protected Health Information (PHI) or personal data is transmitted to any cloud server." },
      { question: "What metadata is removed?", answer: "Clears document title, author name, creator software, PDF producer, and editing timestamps." },
    ],
    relatedSlugs: ["pdf-merger", "invoice-pdf-generator", "freelance-nda-generator"],
  }),
];

const WAVE1_TOOLS: ToolDefinition[] = [
  define({
    slug: "background-remover",
    group: "AI BG & Format Converters",
    title: "AI Background Remover",
    shortDesc: "Cut out your subject. Export a transparent PNG or choose a fresh background.",
    category: "image",
    componentKey: "background-remover",
    engineType: "wasm",
    trending: true,
    relatedBlogSlug: "browser-image-conversion-and-background-removal",
    keywords: ["ai", "cutout", "transparent", "png", "onnx", "remove background"],
    cpcTier: "medium",
    seoTitle: "AI Background Remover: Free Transparent PNG Maker",
    metaDescription: "Remove image backgrounds in your browser with AI. Export high-res transparent PNGs locally with zero uploads. Free, no watermark.",
    formulaExplanation: "Runs local ONNX neural network inference inside WebAssembly and WebGPU to segment subject edges without transmitting photos.",
    workedExamples: [
      { title: "Product Photo", inputSummary: "JPEG with busy background", resultSummary: "Clean isolated product cutout on transparent alpha channel." },
    ],
    faqs: [
      { question: "Does my photo leave this browser?", answer: "No. Your image is processed locally. Model files download on first run and run on your device's hardware." },
    ],
    relatedSlugs: ["heic-converter", "video-trimmer"],
  }),
  define({
    slug: "heic-converter",
    group: "AI BG & Format Converters",
    title: "HEIC to JPG / WebP",
    shortDesc: "Make iPhone photos easier to share, with local conversion and quality controls.",
    category: "image",
    componentKey: "heic-converter",
    engineType: "wasm",
    trending: true,
    relatedBlogSlug: "heic-to-jpg-webp-for-us-workflows",
    keywords: ["heic", "heif", "jpg", "jpeg", "webp", "iphone"],
    cpcTier: "medium",
    seoTitle: "HEIC to JPG Converter: Fast In-Browser Conversion",
    metaDescription: "Convert Apple HEIC photos to universal JPG or WebP in your browser. Batch conversion with quality controls. 100% local and private.",
    formulaExplanation: "Decodes HEIC container frames via browser WebAssembly and re-encodes into JPEG or WebP canvas streams.",
    workedExamples: [
      { title: "iPhone Photo Export", inputSummary: "IMG_0042.HEIC (12 MP)", resultSummary: "Universal JPG with custom compression quality." },
    ],
    faqs: [
      { question: "Are original photos modified?", answer: "No, new files are generated and downloaded while originals remain intact." },
    ],
    relatedSlugs: ["background-remover", "zip-tool"],
  }),
  define({
    slug: "zip-tool",
    group: "Testing, Archives & Generators",
    title: "ZIP Extractor & Creator",
    shortDesc: "Look inside archives, extract files, or bundle a new ZIP without uploading.",
    category: "dev",
    componentKey: "zip-tool",
    engineType: "worker",
    trending: true,
    relatedBlogSlug: "zip-files-extract-create-safely",
    keywords: ["zip", "archive", "extract", "compress", "unzip"],
    cpcTier: "medium",
    seoTitle: "ZIP Extractor & Creator: Open & Build Archives Online",
    metaDescription: "Extract files from ZIP archives or create new compressed ZIP files locally in your browser. Zero server uploads, protected against zip-bombs.",
    formulaExplanation: "Uses jszip in a dedicated Web Worker with strict decompression boundaries to prevent zip-bomb memory exhaustion.",
    workedExamples: [
      { title: "Bundle Documents", inputSummary: "5 PDF contracts + 2 spreadsheets", resultSummary: "Fast client-side compressed archive.zip download." },
    ],
    faqs: [
      { question: "Are my files uploaded?", answer: "No. Everything runs inside a browser Web Worker on your computer." },
    ],
    relatedSlugs: ["json-formatter", "qr-generator"],
  }),
  define({
    slug: "pdf-merger",
    group: "PDF Page Organizers",
    title: "PDF Merger & Page Reorder",
    shortDesc: "Combine documents, rearrange individual pages, and export one organized PDF.",
    category: "pdf",
    componentKey: "pdf-merger",
    engineType: "worker",
    trending: true,
    relatedBlogSlug: "how-to-merge-pdfs-privately-in-browser",
    keywords: ["pdf", "merge", "combine", "reorder", "document"],
    cpcTier: "high",
    seoTitle: "Merge PDF Files Online: Rearrange & Combine Pages",
    metaDescription: "Combine multiple PDF documents and reorder pages locally in your browser with drag-and-drop. Zero file uploads, 100% private.",
    formulaExplanation: "Inspects PDF page dictionaries and copies vector streams into a unified new PDFDocument using pdf-lib in a Web Worker.",
    workedExamples: [
      { title: "Consolidate Invoices", inputSummary: "3 individual invoice PDFs", resultSummary: "Single organized 3-page packet." },
    ],
    faqs: [
      { question: "Can I reorder individual pages?", answer: "Yes, you can position, swap, and delete specific pages from any source document." },
    ],
    relatedSlugs: ["local-pdf-redactor", "invoice-pdf-generator"],
  }),
  define({
    slug: "json-formatter",
    group: "Formatters & Code-to-Image",
    title: "Privacy-First JSON Formatter",
    shortDesc: "Validate, format, and minify JSON in a clean, local-only editor.",
    category: "dev",
    componentKey: "json-formatter",
    engineType: "native",
    trending: true,
    relatedBlogSlug: "json-formatting-validation-and-data-safety",
    keywords: ["json", "validate", "minify", "format", "pretty"],
    cpcTier: "high",
    seoTitle: "Privacy-First JSON Formatter & Validator Online",
    metaDescription: "Format, validate, and minify sensitive JSON payloads locally. Zero server transmission protects API keys, passwords, and tokens.",
    formulaExplanation: "Parses and serializes JavaScript Object Notation in browser memory with exact syntax error line/column detection.",
    workedExamples: [
      { title: "Minified API Response", inputSummary: "Single-line compacted JSON", resultSummary: "Clean 2-space indented readable tree structure." },
    ],
    faqs: [
      { question: "Is my JSON stored or sent to a server?", answer: "Never. All parsing stays in tab memory. Ideal for sensitive tokens and configuration files." },
    ],
    relatedSlugs: ["zip-tool", "qr-generator"],
  }),
  define({
    slug: "qr-generator",
    group: "QR & Barcodes",
    title: "WiFi & URL QR Generator",
    shortDesc: "Turn a web link or WiFi details into a scan-ready PNG or SVG.",
    category: "crypto",
    componentKey: "qr-generator",
    engineType: "native",
    relatedBlogSlug: "wifi-url-qr-code-printing-guide",
    keywords: ["qr", "wifi", "url", "barcode", "network"],
    cpcTier: "medium",
    seoTitle: "WiFi & URL QR Code Generator: Export PNG & SVG",
    metaDescription: "Create static QR codes for website URLs and WiFi networks. Export high-res PNG or scalable vector SVG for print. Free, no tracking redirects.",
    formulaExplanation: "Encodes alphanumeric and binary text into standard Reed-Solomon error-corrected QR matrixes.",
    workedExamples: [
      { title: "Guest WiFi Access", inputSummary: "SSID: OfficeGuest, WPA2 password", resultSummary: "Direct scan-to-connect QR code." },
    ],
    faqs: [
      { question: "Do these QR codes expire?", answer: "No. They are static codes that store raw text or WiFi credentials directly without redirect servers." },
    ],
    relatedSlugs: ["json-formatter", "word-counter"],
  }),
  define({
    slug: "word-counter",
    group: "Text & List Utilities",
    title: "Word & Readability Counter",
    shortDesc: "Count words and characters, estimate reading time, and inspect English readability.",
    category: "text",
    componentKey: "word-counter",
    engineType: "native",
    relatedBlogSlug: "word-count-readability-for-us-writers",
    keywords: ["words", "characters", "reading", "flesch", "readability", "syllables"],
    cpcTier: "medium",
    seoTitle: "Word Counter & Flesch-Kincaid Readability Grader",
    metaDescription: "Count words, characters, sentences, and syllables in real time. Inspect Flesch Reading Ease and estimated reading times. Free online tool.",
    formulaExplanation: "Evaluates Flesch Reading Ease = 206.835 - 1.015(words/sentences) - 84.6(syllables/words) and Flesch-Kincaid Grade Level.",
    workedExamples: [
      { title: "Essay Analysis", inputSummary: "850-word editorial draft", resultSummary: "850 words, 4.2 min read time, Grade 8.4 readability." },
    ],
    faqs: [
      { question: "Are emoji counted accurately?", answer: "Yes, uses Intl.Segmenter where supported to count user-perceived grapheme clusters." },
    ],
    relatedSlugs: ["youtube-toolkit", "video-trimmer"],
  }),
  define({
    slug: "youtube-toolkit",
    group: "Thumbnail & Media Tools",
    title: "YouTube Thumbnail & SRT Toolkit",
    shortDesc: "Find available thumbnail sizes and turn pasted subtitle files into readable text.",
    category: "youtube",
    componentKey: "youtube-toolkit",
    engineType: "native",
    relatedBlogSlug: "youtube-thumbnails-and-srt-cleanup-guide",
    keywords: ["youtube", "thumbnail", "srt", "vtt", "transcript", "captions"],
    cpcTier: "medium",
    seoTitle: "YouTube Thumbnail Downloader & SRT Transcript Cleaner",
    metaDescription: "Download HD 1280x720 YouTube thumbnails and convert SRT/VTT caption files into clean readable text without timestamps. Free creator toolkit.",
    formulaExplanation: "Queries public YouTube image CDNs (i.ytimg.com) and parses SubRip and WebVTT cue timecodes using regex.",
    workedExamples: [
      { title: "Extract Captions", inputSummary: "Pasted raw SRT with timestamps", resultSummary: "Clean, continuous paragraph text." },
    ],
    faqs: [
      { question: "Can I fetch video transcripts directly?", answer: "No, you paste or upload your own SRT/VTT file for local text stripping." },
    ],
    relatedSlugs: ["video-trimmer", "adsense-rpm-calculator"],
  }),
  define({
    slug: "percentage-calculator",
    group: "Math, Stats & Health",
    title: "Percentage & Profit Margin",
    shortDesc: "Calculate shares, percentage changes, profit margins, and markup with visible formulas.",
    category: "calculator",
    componentKey: "percentage-calculator",
    engineType: "native",
    relatedBlogSlug: "profit-margin-markup-percentage-examples",
    keywords: ["percentage", "margin", "profit", "markup", "change"],
    cpcTier: "high",
    seoTitle: "Percentage & Profit Margin Calculator (With Formulas)",
    metaDescription: "Calculate percentage of, percentage change, gross profit margin, and markup percentages with clear formulas. Free, instant browser calculator.",
    formulaExplanation: "Margin = (Profit ÷ Selling Price) × 100. Markup = (Profit ÷ Cost) × 100. Percentage Change = [(New - Old) ÷ Old] × 100.",
    workedExamples: [
      { title: "Product Markup", inputSummary: "Cost: $60 · Selling Price: $100", resultSummary: "Gross Margin: 40% · Markup: 66.7% · Profit: $40" },
    ],
    faqs: [
      { question: "How does margin differ from markup?", answer: "Margin divides profit by selling price; markup divides profit by cost." },
    ],
    relatedSlugs: ["unit-converter", "stripe-fee-calculator"],
  }),
  define({
    slug: "unit-converter",
    group: "Unit & Storage Converters",
    title: "Unit & Data Storage Converter",
    shortDesc: "Convert everyday measurements, temperatures, and decimal or binary data units.",
    category: "calculator",
    componentKey: "unit-converter",
    engineType: "native",
    relatedBlogSlug: "gb-vs-gib-and-everyday-unit-conversion",
    keywords: ["unit", "data", "storage", "gb", "gib", "temperature", "length", "weight"],
    cpcTier: "medium",
    seoTitle: "Unit & Data Storage Converter: GB vs GiB & Metric",
    metaDescription: "Convert decimal GB vs binary GiB storage units, metric and imperial lengths, weights, areas, and temperatures. Free precision converter.",
    formulaExplanation: "Computes unit factors and thermodynamic temperature offsets between Celsius, Fahrenheit, and Kelvin.",
    workedExamples: [
      { title: "Hard Drive Capacity", inputSummary: "1,000 GB (Decimal)", resultSummary: "931.32 GiB (Binary) as reported by Windows OS." },
    ],
    faqs: [
      { question: "What is the difference between GB and GiB?", answer: "1 GB is 1,000,000,000 bytes (10^9), while 1 GiB is 1,073,741,824 bytes (2^30)." },
    ],
    relatedSlugs: ["percentage-calculator", "mortgage-calculator"],
  }),
];

export const HANDCRAFTED_TOOLS: ToolDefinition[] = [...TIER1_TOOLS, ...WAVE1_TOOLS];

const ENGINE_KEYS: Record<CatalogEntry["engine"], string> = {
  text: "text-engine",
  calc: "calc-engine",
  image: "image-engine",
  pdf: "pdf-engine",
  planned: "planned-tool",
};

function fromCatalog(category: ToolCategory, entry: CatalogEntry): ToolDefinition {
  const seoTitle = generateSeoTitle(entry.title);
  const metaDescription = generateMetaDescription(entry.shortDesc);
  const keywords = enrichToolKeywords(entry.keywords);
  const base = {
    id: entry.slug,
    slug: entry.slug,
    title: entry.title,
    name: entry.title,
    shortDesc: entry.shortDesc,
    category,
    group: entry.group,
    keywords,
    componentKey: ENGINE_KEYS[entry.engine],
    trending: false,
    indexable: true,
    cpcTier: "medium" as const,
    region: "GLOBAL" as const,
    seoTitle,
    metaDescription,
    formulaExplanation: `Calculates ${entry.title.toLowerCase()} operations locally inside your web browser.`,
    workedExamples: [
      {
        title: "Standard Input",
        inputSummary: "Default parameters",
        resultSummary: "Accurate real-time calculated result",
      },
      {
        title: "Extended Input",
        inputSummary: "Custom parameters",
        resultSummary: "Recomputed breakdown",
      },
    ],
    faqs: [
      {
        question: `How does the ${entry.title} work?`,
        answer: `It processes calculations and conversions 100% client-side in your browser using modern Web APIs.`,
      },
      {
        question: "Is my data uploaded to any server?",
        answer: "No. Your inputs stay in your local browser tab memory and are never uploaded to any remote server.",
      },
      {
        question: "Is this tool free to use?",
        answer: "Yes, it is completely free with no account or registration required.",
      },
    ],
    faq: [
      {
        q: `How does the ${entry.title} work?`,
        a: `It processes calculations and conversions 100% client-side in your browser using modern Web APIs.`,
      },
      {
        q: "Is my data uploaded to any server?",
        a: "No. Your inputs stay in your local browser tab memory and are never uploaded to any remote server.",
      },
      {
        q: "Is this tool free to use?",
        a: "Yes, it is completely free with no account or registration required.",
      },
    ],
    relatedSlugs: [],
  };

  if (entry.engine === "planned") {
    const heavy = /ffmpeg|tesseract|sql.js|onnx|wasm/i.test(entry.plannedEngine);
    return {
      ...base,
      engineType: heavy ? "wasm" : "native",
      isWasm: heavy,
      status: "planned",
      plannedEngine: entry.plannedEngine,
      plannedInput: entry.plannedInput,
      preset: { plannedEngine: entry.plannedEngine, plannedInput: entry.plannedInput },
    };
  }
  const engineType = entry.engine === "pdf" ? "worker" : "native";
  return { ...base, engineType, isWasm: false, status: "live", preset: { module: entry.module, op: entry.op } };
}

function buildTools(): ToolDefinition[] {
  const all = [...HANDCRAFTED_TOOLS];
  const seen = new Set(all.map(tool => tool.slug));
  for (const [category, entries] of Object.entries(CATALOG) as Array<[ToolCategory, CatalogEntry[]]>) {
    for (const entry of entries) {
      if (seen.has(entry.slug)) continue;
      seen.add(entry.slug);
      all.push(fromCatalog(category, entry));
    }
  }
  return all;
}

export const TOOLS_REGISTRY: ToolDefinition[] = buildTools();
export const tools = TOOLS_REGISTRY;
export const liveTools = tools.filter(tool => tool.status === "live");
export const toolPath = (tool: ToolDefinition) => `/tools/${tool.category}/${tool.slug}/`;
export const getTool = (slug: string) => tools.find(tool => tool.slug === slug);
export const isCategory = (value: string): value is ToolCategory => Object.hasOwn(categories, value);
