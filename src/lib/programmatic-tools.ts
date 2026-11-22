import { US_STATES } from "@/data/programmatic/us-states";
import { TIER1_COUNTRIES } from "@/data/programmatic/tier1-countries";
import { PAYMENT_PLATFORMS } from "@/data/programmatic/payment-platforms";
import { UNIT_PAIRS } from "@/data/programmatic/unit-pairs";
import { FORMAT_PAIRS } from "@/data/programmatic/format-pairs";
import { US_MAJOR_CITIES } from "@/data/programmatic/us-cities";
import { INVESTMENT_CRYPTO_TOOLS } from "@/data/programmatic/investments-crypto";
import { GROWTH_ECOMMERCE_TOOLS } from "@/data/programmatic/growth-ecommerce";
import { CONTRACTOR_BILLING_TOOLS } from "@/data/programmatic/contractor-billing";
import type { ToolDefinition } from "./tools-registry";

/**
 * Generates programmatic high-CPC SEO tool definitions with real data,
 * unique calculations, and dynamic FAQs.
 */
export function generateProgrammaticTools(): ToolDefinition[] {
  const programmaticList: ToolDefinition[] = [];

  // ==========================================
  // FAMILY 1: US State Tax & Paycheck Engines
  // ==========================================
  for (const s of US_STATES) {
    // 1. Paycheck Calculator
    programmaticList.push({
      id: `prog-${s.slug}-paycheck-calculator`,
      slug: `${s.slug}-paycheck-calculator`,
      name: `${s.name} Paycheck Calculator`,
      title: `${s.name} Paycheck Calculator (2026 Take-Home Pay)`,
      shortDesc: `Calculate your exact ${s.name} net take-home pay after federal taxes, FICA, and ${s.name} state income tax.`,
      seoTitle: `${s.name} Paycheck Calculator 2026 – Free Take-Home Pay`,
      metaDescription: `Calculate your take-home paycheck in ${s.name}. Free 2026 tax calculator with federal, FICA, and state tax deductions. 100% private, no signup.`,
      category: "finance",
      group: "US State Paycheck & Taxes",
      region: "US",
      cpcTier: "high",
      engineType: "native",
      componentKey: "state-tax-paycheck-engine",
      preset: { stateCode: s.code, stateSlug: s.slug, calcMode: "paycheck" },
      status: "live",
      indexable: true,
      isWasm: false,
      trending: ["CA", "TX", "FL", "NY", "IL", "PA"].includes(s.code),
      publishWave: 1,
      keywords: [
        `${s.name.toLowerCase()} paycheck calculator`,
        `${s.slug} take home pay`,
        `${s.code.toLowerCase()} salary calculator`,
        "2026 paycheck calculator",
        "free salary calculator",
      ],
      formulaExplanation: `Net Pay in ${s.name} = Gross Pay − Federal Withholding (2026 IRS Brackets) − Social Security (6.2%) − Medicare (1.45%) − ${s.name} State Tax (${s.hasIncomeTax ? (s.incomeTaxType === "flat" ? `${s.flatRate}% flat` : `up to ${s.topMarginalRate}%`) : "0% No State Income Tax"}).`,
      workedExamples: [
        {
          title: `$75,000 Annual Salary in ${s.name}`,
          inputSummary: `$75,000 gross salary, Single filer, paid Bi-Weekly in ${s.name}.`,
          resultSummary: `Estimated net paycheck is approx. $2,180 – $2,420 bi-weekly depending on local deductions.`,
        },
      ],
      faqs: [
        {
          question: `Does ${s.name} have a state income tax?`,
          answer: s.hasIncomeTax
            ? `Yes, ${s.name} has a state income tax with a top marginal rate of ${s.topMarginalRate}%.`
            : `No. ${s.name} is one of the states with 0% state income tax, allowing residents to keep more of their paycheck.`,
        },
        {
          question: `How is overtime calculated in ${s.name}?`,
          answer: `Overtime in ${s.name} follows ${s.overtimeRule === "daily_8" ? "daily overtime (1.5x after 8 hours in a day)" : "standard FLSA rules (1.5x regular pay after 40 hours in a workweek)"}.`,
        },
      ],
      faq: [
        {
          q: `Is this ${s.name} paycheck calculator free?`,
          a: `Yes, 100% free with no sign-up or data upload required.`,
        },
      ],
      relatedSlugs: [`${s.slug}-income-tax-calculator`, `${s.slug}-sales-tax-calculator`],
    });

    // 2. State Income Tax Calculator
    programmaticList.push({
      id: `prog-${s.slug}-income-tax-calculator`,
      slug: `${s.slug}-income-tax-calculator`,
      name: `${s.name} Income Tax Calculator`,
      title: `${s.name} Income Tax Calculator (2026 State Tax Rates)`,
      shortDesc: `Estimate your ${s.name} state and federal tax liabilities, effective tax rate, and net income.`,
      seoTitle: `${s.name} Income Tax Calculator 2026 – State Tax Rates`,
      metaDescription: `Free ${s.name} state income tax calculator. Check your 2026 tax brackets, deductions, and total tax burden. 100% private, no signup.`,
      category: "finance",
      group: "US State Paycheck & Taxes",
      region: "US",
      cpcTier: "high",
      engineType: "native",
      componentKey: "state-tax-paycheck-engine",
      preset: { stateCode: s.code, stateSlug: s.slug, calcMode: "paycheck" },
      status: "live",
      indexable: true,
      isWasm: false,
      trending: false,
      publishWave: 1,
      keywords: [
        `${s.name.toLowerCase()} state income tax`,
        `${s.code.toLowerCase()} tax brackets`,
        `${s.slug} tax calculator`,
        "state income tax 2026",
      ],
      formulaExplanation: `Total Tax in ${s.name} = Federal Income Tax + FICA Taxes + ${s.name} Statutory Income Tax.`,
      workedExamples: [
        {
          title: `$100,000 W-2 Income in ${s.name}`,
          inputSummary: `$100,000 taxable wages for a Single filer in ${s.name}.`,
          resultSummary: `Total effective tax rate typically ranges from 18% to 28% including federal and FICA.`,
        },
      ],
      faqs: [
        {
          question: `What are the ${s.name} state income tax brackets?`,
          answer: s.hasIncomeTax
            ? `${s.name} levies an income tax of ${s.incomeTaxType === "flat" ? `a flat ${s.flatRate}%` : `progressive rates up to ${s.topMarginalRate}%`}.`
            : `${s.name} does not impose state personal income tax on earned wages.`,
        },
      ],
      faq: [{ q: `Is my income information saved?`, a: `Never. Everything computes locally in your browser tab.` }],
      relatedSlugs: [`${s.slug}-paycheck-calculator`],
    });

    // 3. Sales Tax Calculator
    programmaticList.push({
      id: `prog-${s.slug}-sales-tax-calculator`,
      slug: `${s.slug}-sales-tax-calculator`,
      name: `${s.name} Sales Tax Calculator`,
      title: `${s.name} Sales Tax Calculator (${s.avgSalesTax}% Avg Rate)`,
      shortDesc: `Calculate exact state, county, and local sales tax on purchases in ${s.name}.`,
      seoTitle: `${s.name} Sales Tax Calculator – State & Local Rates`,
      metaDescription: `Calculate ${s.name} sales tax instantly. Base state rate of ${s.stateSalesTax}% with average combined rate of ${s.avgSalesTax}%. Free, no signup required.`,
      category: "calculator",
      group: "Sales & Commercial Taxes",
      region: "US",
      cpcTier: "medium",
      engineType: "native",
      componentKey: "state-tax-paycheck-engine",
      preset: { stateCode: s.code, stateSlug: s.slug, calcMode: "sales-tax" },
      status: "live",
      indexable: true,
      isWasm: false,
      trending: false,
      publishWave: 2,
      keywords: [
        `${s.name.toLowerCase()} sales tax calculator`,
        `${s.slug} sales tax rate`,
        `${s.code.toLowerCase()} sales tax`,
        "calculate sales tax",
      ],
      formulaExplanation: `Total Price = Purchase Amount + (Purchase Amount × ${s.name} State Sales Tax ${s.stateSalesTax}%) + Local County Tax.`,
      workedExamples: [
        {
          title: `$500 Purchase in ${s.name}`,
          inputSummary: `$500 retail purchase subject to ${s.name} average ${s.avgSalesTax}% combined sales tax.`,
          resultSummary: `Sales tax is approx. $${(500 * (s.avgSalesTax / 100)).toFixed(2)}, making the total checkout price $${(500 * (1 + s.avgSalesTax / 100)).toFixed(2)}.`,
        },
      ],
      faqs: [
        {
          question: `What is the state sales tax rate in ${s.name}?`,
          answer: `The statewide base sales tax rate in ${s.name} is ${s.stateSalesTax}%, with an average combined local rate of ${s.avgSalesTax}%.`,
        },
      ],
      faq: [{ q: `Is this tool up to date?`, a: `Yes, configured with 2026 statutory rates.` }],
      relatedSlugs: [`${s.slug}-paycheck-calculator`],
    });

    // 4. Hourly to Salary Calculator
    programmaticList.push({
      id: `prog-${s.slug}-hourly-to-salary-calculator`,
      slug: `${s.slug}-hourly-to-salary-calculator`,
      name: `${s.name} Hourly to Salary Calculator`,
      title: `${s.name} Hourly to Salary Calculator (Annual & Net Pay)`,
      shortDesc: `Convert hourly wages to annual salary in ${s.name} with net take-home pay after deductions.`,
      seoTitle: `${s.name} Hourly to Salary Calculator – Convert Wage to Salary`,
      metaDescription: `Convert hourly rate to annual salary in ${s.name}. See gross annual earnings and take-home pay after taxes. Free, private, no signup.`,
      category: "finance",
      group: "US State Paycheck & Taxes",
      region: "US",
      cpcTier: "medium",
      engineType: "native",
      componentKey: "state-tax-paycheck-engine",
      preset: { stateCode: s.code, stateSlug: s.slug, calcMode: "hourly" },
      status: "live",
      indexable: true,
      isWasm: false,
      trending: false,
      publishWave: 2,
      keywords: [
        `${s.name.toLowerCase()} hourly to salary`,
        `${s.slug} wage converter`,
        "hourly rate to annual income",
      ],
      formulaExplanation: `Annual Salary = Hourly Wage × Hours per Week × 52 Weeks.`,
      workedExamples: [
        {
          title: `$30/hour in ${s.name}`,
          inputSummary: `$30.00/hr, 40 hours per week in ${s.name}.`,
          resultSummary: `Gross annual salary is $62,400 per year before taxes.`,
        },
      ],
      faqs: [
        {
          question: `What is full-time annual hours in ${s.name}?`,
          answer: `Full-time employment is generally 2,080 hours per year (40 hours/week × 52 weeks).`,
        },
      ],
      faq: [{ q: `Does this include taxes?`, a: `Yes, displays both gross annual and net take-home pay.` }],
      relatedSlugs: [`${s.slug}-paycheck-calculator`],
    });
  }

  // ==========================================
  // FAMILY 2: E-Commerce, SaaS & Platform Fees
  // ==========================================
  for (const p of PAYMENT_PLATFORMS) {
    // 1. Platform Fee Calculator
    programmaticList.push({
      id: `prog-${p.slug}-fee-calculator`,
      slug: `${p.slug}-fee-calculator`,
      name: `${p.name} Fee Calculator`,
      title: `${p.name} Fee Calculator (Exact Seller & Merchant Rates)`,
      shortDesc: `Calculate exact ${p.name} transaction fees, processing charges, and net payout in your bank.`,
      seoTitle: `${p.name} Fee Calculator – Exact Seller & Payout Rates`,
      metaDescription: `Calculate ${p.name} merchant fees and net payout. Accurate fee breakdown of ${p.domesticPercent}% + $${p.domesticFixed}. 100% free, no sign up required.`,
      category: "business",
      group: "Payment Gateways & Seller Fees",
      region: "GLOBAL",
      cpcTier: "high",
      engineType: "native",
      componentKey: "platform-fee-engine",
      preset: { platformId: p.id, calcMode: "fee" },
      status: "live",
      indexable: true,
      isWasm: false,
      trending: ["stripe", "paypal-commerce", "shopify-basic", "amazon-fba", "ebay", "etsy"].includes(p.id),
      publishWave: 1,
      keywords: [
        `${p.name.toLowerCase()} fee calculator`,
        `${p.slug} payout calculator`,
        `${p.name.toLowerCase()} merchant fees`,
        "seller transaction fee calculator",
      ],
      formulaExplanation: `${p.name} Fee = (Total Order Value × ${p.domesticPercent}%) + $${p.domesticFixed}. Net Payout = Total Order Value − Fee.`,
      workedExamples: [
        {
          title: `$100 Sale on ${p.name}`,
          inputSummary: `$100 order value with standard domestic processing.`,
          resultSummary: `Fee is $${(100 * (p.domesticPercent / 100) + p.domesticFixed).toFixed(2)}, resulting in a net payout of $${(100 - (100 * (p.domesticPercent / 100) + p.domesticFixed)).toFixed(2)}.`,
        },
      ],
      faqs: [
        {
          question: `What are the standard processing fees for ${p.name}?`,
          answer: `${p.name} charges ${p.domesticPercent}% + $${p.domesticFixed} for standard domestic transactions, and ${p.intlPercent}% + $${p.intlFixed} for international payments.`,
        },
        {
          question: `When does ${p.name} pay out funds?`,
          answer: `Payout schedule for ${p.name} is: ${p.payoutSchedule}.`,
        },
      ],
      faq: [{ q: `Is this calculator up to date with official rates?`, a: `Yes, matches ${p.pricingUrlName}.` }],
      relatedSlugs: ["stripe-fee-calculator", "amazon-fba-calculator"],
    });

    // 2. Reverse Net Fee Calculator
    programmaticList.push({
      id: `prog-${p.slug}-reverse-calculator`,
      slug: `${p.slug}-reverse-calculator`,
      name: `${p.name} Reverse Fee Calculator`,
      title: `${p.name} Reverse Fee Calculator (How Much to Charge)`,
      shortDesc: `Determine the exact invoice or price to charge on ${p.name} to receive your desired net profit.`,
      seoTitle: `${p.name} Reverse Fee Calculator – What to Charge for Target Payout`,
      metaDescription: `Find out how much to charge on ${p.name} to keep your target amount after processing fees. 100% free online calculator with zero data uploads.`,
      category: "business",
      group: "Payment Gateways & Seller Fees",
      region: "GLOBAL",
      cpcTier: "high",
      engineType: "native",
      componentKey: "platform-fee-engine",
      preset: { platformId: p.id, calcMode: "reverse" },
      status: "live",
      indexable: true,
      isWasm: false,
      trending: false,
      publishWave: 2,
      keywords: [
        `${p.name.toLowerCase()} reverse fee calculator`,
        `how much to charge on ${p.name.toLowerCase()}`,
        `${p.slug} net payout calculator`,
      ],
      formulaExplanation: `Required Price = (Target Net + $${p.domesticFixed}) ÷ (1 − ${p.domesticPercent / 100}).`,
      workedExamples: [
        {
          title: `Netting $1,000 on ${p.name}`,
          inputSummary: `Desire exact $1,000 in your bank account after fees.`,
          resultSummary: `You should charge approx. $${((1000 + p.domesticFixed) / (1 - p.domesticPercent / 100)).toFixed(2)}.`,
        },
      ],
      faqs: [
        {
          question: `Why do fees increase when charging more?`,
          answer: `Because payment percentage fees apply to the total transaction amount (including the fee itself). The reverse formula mathematically accounts for this.`,
        },
      ],
      faq: [{ q: `Does this work for international fees?`, a: `Yes, you can toggle the cross-border option.` }],
      relatedSlugs: [`${p.slug}-fee-calculator`],
    });
  }

  // ==========================================
  // FAMILY 3: Tier-1 Countries (UK, CA, AU, NZ)
  // ==========================================
  // UK
  programmaticList.push({
    id: "prog-uk-vat-calculator",
    slug: "uk-vat-calculator",
    name: "UK VAT Calculator",
    title: "UK VAT Calculator (20% Standard & Flat Rate)",
    shortDesc: "Add or remove 20% UK VAT from any price or invoice with net and gross breakdowns.",
    seoTitle: "UK VAT Calculator 2026 – Add or Remove 20% VAT Free",
    metaDescription: "Calculate UK VAT easily. Add or remove 20% VAT, find net and gross amounts, and generate invoices. 100% free, private browser calculator.",
    category: "finance",
    group: "International & UK Finance",
    region: "UK",
    cpcTier: "high",
    engineType: "native",
    componentKey: "tier1-country-finance-engine",
    preset: { countryKey: "uk", calcMode: "vat_gst" },
    status: "live",
    indexable: true,
    isWasm: false,
    trending: true,
    publishWave: 1,
    keywords: ["uk vat calculator", "add 20 vat", "remove vat uk", "vat invoice calculator"],
    formulaExplanation: "VAT Added = Net × 0.20. VAT Removed = Gross ÷ 1.20.",
    workedExamples: [
      {
        title: "£100 Net Price",
        inputSummary: "£100 pre-VAT invoice amount.",
        resultSummary: "£20.00 VAT added, making the gross price £120.00.",
      },
    ],
    faqs: [
      {
        question: "What is the standard UK VAT rate?",
        answer: "The standard UK VAT rate is 20% on most commercial goods and services.",
      },
    ],
    faq: [{ q: "Is this tool free?", a: "Yes, 100% free with no sign-up." }],
    relatedSlugs: ["uk-take-home-pay"],
  });

  // Canada Provinces (13 provinces)
  for (const prov of TIER1_COUNTRIES.canada.subRegions || []) {
    programmaticList.push({
      id: `prog-${prov.slug}-gst-hst-calculator`,
      slug: `${prov.slug}-gst-hst-calculator`,
      name: `${prov.name} Sales Tax Calculator (${prov.vatRate}% ${prov.provincialTaxType || "Tax"})`,
      title: `${prov.name} Sales Tax Calculator (${prov.vatRate}% Combined Tax)`,
      shortDesc: `Calculate exact ${prov.name} ${prov.provincialTaxType || "GST/PST/HST"} on purchases and invoices.`,
      seoTitle: `${prov.name} Sales Tax Calculator 2026 – ${prov.vatRate}% Combined Tax`,
      metaDescription: `Calculate sales tax in ${prov.name}, Canada. Accurate ${prov.vatRate}% ${prov.provincialTaxType || "tax"} calculator. Free, client-side, zero server uploads.`,
      category: "finance",
      group: "Canada Provincial Taxes",
      region: "CA",
      cpcTier: "high",
      engineType: "native",
      componentKey: "tier1-country-finance-engine",
      preset: { countryKey: "canada", calcMode: "vat_gst" },
      status: "live",
      indexable: true,
      isWasm: false,
      trending: ["ontario", "british-columbia", "alberta", "quebec"].includes(prov.slug),
      publishWave: 1,
      keywords: [
        `${prov.name.toLowerCase()} sales tax calculator`,
        `${prov.slug} hst calculator`,
        `${prov.code.toLowerCase()} gst rate`,
        "canada sales tax calculator",
      ],
      formulaExplanation: `Total = Price + (Price × ${prov.vatRate}%).`,
      workedExamples: [
        {
          title: `C$100 Purchase in ${prov.name}`,
          inputSummary: `C$100 retail purchase in ${prov.name}.`,
          resultSummary: `Tax is C$${(100 * (prov.vatRate / 100)).toFixed(2)}, total is C$${(100 * (1 + prov.vatRate / 100)).toFixed(2)}.`,
        },
      ],
      faqs: [
        {
          question: `What is the tax rate in ${prov.name}?`,
          answer: `The combined tax rate in ${prov.name} is ${prov.vatRate}% (${prov.provincialTaxType || "GST/HST"}).`,
        },
      ],
      faq: [{ q: "Is this updated for 2026?", a: "Yes, verified with CRA provincial schedules." }],
      relatedSlugs: ["canada-gst-hst-calculator"],
    });
  }

  // Australia GST & Income Tax
  programmaticList.push({
    id: "prog-australia-gst-calculator",
    slug: "australia-gst-calculator",
    name: "Australia GST Calculator",
    title: "Australia GST Calculator (10% Goods & Services Tax)",
    shortDesc: "Add or remove 10% Australian GST with instant ATO-compliant invoice breakdowns.",
    seoTitle: "Australia GST Calculator – Add or Subtract 10% GST Free",
    metaDescription: "Calculate Australian GST. Add or remove 10% GST instantly, check net vs gross amounts, and download summaries. 100% free, private browser tool.",
    category: "finance",
    group: "Australia & NZ Finance",
    region: "AU",
    cpcTier: "high",
    engineType: "native",
    componentKey: "tier1-country-finance-engine",
    preset: { countryKey: "australia", calcMode: "vat_gst" },
    status: "live",
    indexable: true,
    isWasm: false,
    trending: true,
    publishWave: 1,
    keywords: ["australia gst calculator", "add 10 gst", "ato gst calculation", "gst calculator au"],
    formulaExplanation: "GST Added = Amount × 0.10. GST Removed = Amount ÷ 11.",
    workedExamples: [
      {
        title: "A$110 Gross Amount",
        inputSummary: "A$110 GST-inclusive total price.",
        resultSummary: "Contains A$10.00 GST (divide by 11), with net value of A$100.00.",
      },
    ],
    faqs: [
      {
        question: "How do you calculate GST in Australia?",
        answer: "To add GST, multiply the pre-tax amount by 10%. To remove GST from a total, divide the total price by 11.",
      },
    ],
    faq: [{ q: "Does this require login?", a: "No login or data collection required." }],
    relatedSlugs: ["uk-vat-calculator"],
  });

  // ==========================================
  // FAMILY 4: High-Search Unit Conversion Pairs
  // ==========================================
  for (const u of UNIT_PAIRS) {
    programmaticList.push({
      id: `prog-${u.slug}`,
      slug: u.slug,
      name: `${u.fromName} to ${u.toName} Converter`,
      title: `${u.fromName} to ${u.toName} Converter (${u.fromSymbol} to ${u.toSymbol})`,
      shortDesc: `Convert ${u.fromName} to ${u.toName} instantly with precision formulas, live math, and conversion tables.`,
      seoTitle: `${u.fromName} to ${u.toName} Converter – Accurate ${u.fromSymbol} to ${u.toSymbol}`,
      metaDescription: `Convert ${u.fromName.toLowerCase()} to ${u.toName.toLowerCase()} (${u.fromSymbol} to ${u.toSymbol}) instantly. Live conversion calculator with formulas and reference tables. 100% free.`,
      category: "calculator",
      group: "Unit Conversion Matrix",
      region: "GLOBAL",
      cpcTier: "medium",
      engineType: "native",
      componentKey: "unit-pair-converter-engine",
      preset: { pairId: u.id },
      status: "live",
      indexable: true,
      isWasm: false,
      trending: ["meters-to-feet", "kg-to-lbs", "celsius-to-fahrenheit", "inches-to-cm", "mb-to-gb"].includes(u.id),
      publishWave: 1,
      keywords: [
        `${u.fromName.toLowerCase()} to ${u.toName.toLowerCase()}`,
        `convert ${u.fromSymbol.toLowerCase()} to ${u.toSymbol.toLowerCase()}`,
        `${u.fromName.toLowerCase()} into ${u.toName.toLowerCase()}`,
        "unit converter online",
      ],
      formulaExplanation: u.formulaDescription,
      workedExamples: [
        {
          title: `Converting ${u.exampleValue} ${u.fromSymbol}`,
          inputSummary: `${u.exampleValue} ${u.fromName} (${u.fromSymbol}).`,
          resultSummary: `Calculates to approx. ${(u.customConvert ? u.customConvert(u.exampleValue) : u.exampleValue * u.factor).toFixed(4)} ${u.toSymbol}.`,
        },
      ],
      faqs: [
        {
          question: `How many ${u.toName} in a ${u.fromName}?`,
          answer: `1 ${u.fromName} (${u.fromSymbol}) is equal to approx. ${(u.customConvert ? u.customConvert(1) : u.factor).toFixed(4)} ${u.toName} (${u.toSymbol}).`,
        },
      ],
      faq: [{ q: "Is this conversion mathematically exact?", a: "Yes, calibrated to NIST and BIPM standards." }],
      relatedSlugs: ["unit-converter", "percentage-calculator"],
    });
  }

  // ==========================================
  // FAMILY 5: In-Browser Format Pair Converters
  // ==========================================
  for (const f of FORMAT_PAIRS) {
    programmaticList.push({
      id: `prog-${f.slug}`,
      slug: f.slug,
      name: `${f.fromFormat} to ${f.toFormat} Converter`,
      title: `${f.fromExt.toUpperCase()} to ${f.toExt.toUpperCase()} Converter (100% Private In-Browser)`,
      shortDesc: f.shortDescription,
      seoTitle: `Convert ${f.fromExt.toUpperCase()} to ${f.toExt.toUpperCase()} Online – Free & Private`,
      metaDescription: `Convert ${f.fromExt.toUpperCase()} to ${f.toExt.toUpperCase()} directly in your browser. 100% private, zero server uploads, unlimited free conversions.`,
      category: f.category === "image" ? "image" : "dev",
      group: "Browser-Side File Converters",
      region: "GLOBAL",
      cpcTier: "high",
      engineType: "native",
      componentKey: "format-pair-converter-engine",
      preset: { pairId: f.id },
      status: "live",
      indexable: true,
      isWasm: false,
      trending: ["webp-to-png", "webp-to-jpg", "csv-to-json", "json-to-csv"].includes(f.id),
      publishWave: 1,
      keywords: [
        `${f.fromExt.toLowerCase()} to ${f.toExt.toLowerCase()}`,
        `convert ${f.fromExt.toLowerCase()} to ${f.toExt.toLowerCase()} free`,
        `${f.fromExt.toLowerCase()} to ${f.toExt.toLowerCase()} converter online`,
        "private browser converter",
      ],
      formulaExplanation: `Runs entirely on your device via client-side Web APIs (${f.engine === "canvas" ? "HTML5 Canvas" : "in-memory stream parsers"}). No files or strings leave your computer.`,
      workedExamples: [
        {
          title: `Converting .${f.fromExt} to .${f.toExt}`,
          inputSummary: `Select any standard .${f.fromExt} file on your device.`,
          resultSummary: `Instantly generates a downloadable .${f.toExt} file with zero upload latency.`,
        },
      ],
      faqs: [
        {
          question: `Is it safe to convert sensitive ${f.fromExt.toUpperCase()} files here?`,
          answer: `Yes, 100% safe. Your files are processed entirely inside your local browser tab memory and never uploaded to any cloud server.`,
        },
      ],
      faq: [{ q: "Is there a file size limit?", a: "Only limited by your computer's browser memory." }],
      relatedSlugs: ["heic-converter", "background-remover", "json-formatter"],
    });
  }

  // ==========================================
  // FAMILY 6: US Major City Tax & Paycheck Engines
  // ==========================================
  for (const c of US_MAJOR_CITIES) {
    // 1. City Paycheck Calculator
    programmaticList.push({
      id: `prog-${c.slug}-paycheck-calculator`,
      slug: `${c.slug}-paycheck-calculator`,
      name: `${c.name} Paycheck Calculator`,
      title: `${c.name} Paycheck Calculator (2026 Take-Home Pay & Municipal Taxes)`,
      shortDesc: `Calculate your exact net paycheck in ${c.name}, ${c.stateCode} after federal taxes, FICA, ${c.stateName} state tax, and local city wage deductions.`,
      seoTitle: `${c.name} Paycheck Calculator 2026 – City Take-Home Pay`,
      metaDescription: `Calculate your take-home paycheck in ${c.name}, ${c.stateCode}. Accounts for 2026 IRS federal brackets, state tax, and municipal wage tax. 100% private.`,
      category: "finance",
      group: "US City Paycheck & Local Taxes",
      region: "US",
      cpcTier: "high",
      engineType: "native",
      componentKey: "city-tax-paycheck-engine",
      preset: { citySlug: c.slug, calcMode: "paycheck" },
      status: "live",
      indexable: true,
      isWasm: false,
      trending: ["new-york-city", "los-angeles", "chicago", "houston", "philadelphia"].includes(c.slug),
      publishWave: 2,
      keywords: [
        `${c.name.toLowerCase()} paycheck calculator`,
        `${c.slug} take home pay`,
        `${c.name.toLowerCase()} salary calculator`,
        `${c.name.toLowerCase()} wage tax`,
      ],
      formulaExplanation: `Net Take-Home = Gross Pay − Federal Income Tax − Social Security (6.2%) − Medicare (1.45%) − ${c.stateName} State Tax − ${c.name} Local Tax (${c.hasSpecialLocalTax ? `${c.cityResidentRate}% resident rate` : "0% direct city wage tax"}).`,
      workedExamples: [
        {
          title: `$85,000 Salary in ${c.name}, ${c.stateCode}`,
          inputSummary: `$85,000 gross salary, Single filer, paid Bi-Weekly in ${c.name}.`,
          resultSummary: `Estimated net paycheck is calculated with local municipal deductions and full federal withholding.`,
        },
      ],
      faqs: [
        {
          question: `Does ${c.name} have a local city income or wage tax?`,
          answer: c.hasSpecialLocalTax
            ? `Yes. ${c.name} imposes a local municipal tax (${c.cityResidentRate}% for residents, ${c.cityNonResidentRate}% for non-resident commuters).`
            : `No. ${c.name} does not impose an additional municipal wage tax; only federal and ${c.stateName} state taxes apply.`,
        },
      ],
      faq: [{ q: `Is this ${c.name} paycheck calculator free?`, a: "Yes, 100% free with no sign-up or data upload required." }],
      relatedSlugs: [`${c.slug}-income-tax-calculator`, `${c.stateSlug}-paycheck-calculator`],
    });

    // 2. City Income Tax Calculator
    programmaticList.push({
      id: `prog-${c.slug}-income-tax-calculator`,
      slug: `${c.slug}-income-tax-calculator`,
      name: `${c.name} Income Tax Calculator`,
      title: `${c.name} Income Tax Calculator (2026 City & State Tax Rates)`,
      shortDesc: `Estimate your total tax liability in ${c.name}, ${c.stateCode} including local municipal taxes, state tax brackets, and effective tax rates.`,
      seoTitle: `${c.name} Income Tax Calculator 2026 – Local Wage Tax Rates`,
      metaDescription: `Free ${c.name} local income tax calculator. Check combined municipal and state tax burdens for 2026. 100% private, no signup.`,
      category: "finance",
      group: "US City Paycheck & Local Taxes",
      region: "US",
      cpcTier: "high",
      engineType: "native",
      componentKey: "city-tax-paycheck-engine",
      preset: { citySlug: c.slug, calcMode: "income-tax" },
      status: "live",
      indexable: true,
      isWasm: false,
      trending: false,
      publishWave: 2,
      keywords: [
        `${c.name.toLowerCase()} income tax calculator`,
        `${c.name.toLowerCase()} municipal tax brackets`,
        `${c.slug} local tax rate`,
      ],
      formulaExplanation: `Total Tax Burden = Federal Tax + FICA (7.65%) + ${c.stateName} State Tax + ${c.name} City Tax.`,
      workedExamples: [
        {
          title: `Combined Tax on $100,000 in ${c.name}`,
          inputSummary: `$100,000 annual taxable income as a resident of ${c.name}.`,
          resultSummary: `Calculates exact federal, state, and local city tax percentages.`,
        },
      ],
      faqs: [
        {
          question: `How much is the local tax in ${c.name}?`,
          answer: c.hasSpecialLocalTax
            ? `${c.name} local tax is ${c.cityResidentRate}% for residents.`
            : `${c.name} has no additional local wage tax.`,
        },
      ],
      faq: [{ q: "Are deductions included?", a: "Yes, standard federal and state deductions are applied." }],
      relatedSlugs: [`${c.slug}-paycheck-calculator`, `${c.stateSlug}-income-tax-calculator`],
    });

    // 3. City Hourly to Salary Calculator
    programmaticList.push({
      id: `prog-${c.slug}-hourly-to-salary-calculator`,
      slug: `${c.slug}-hourly-to-salary-calculator`,
      name: `${c.name} Hourly to Salary Calculator`,
      title: `${c.name} Hourly to Salary Calculator (Net Take-Home Pay)`,
      shortDesc: `Convert hourly wages to gross and net annual take-home salary in ${c.name}, ${c.stateCode} with municipal taxes factored in.`,
      seoTitle: `${c.name} Hourly to Salary Calculator – Take-Home Pay`,
      metaDescription: `Convert your hourly pay to annual salary in ${c.name}, ${c.stateCode}. See net take-home pay after local city taxes. 100% private.`,
      category: "finance",
      group: "US City Paycheck & Local Taxes",
      region: "US",
      cpcTier: "medium",
      engineType: "native",
      componentKey: "city-tax-paycheck-engine",
      preset: { citySlug: c.slug, calcMode: "hourly" },
      status: "live",
      indexable: true,
      isWasm: false,
      trending: false,
      publishWave: 2,
      keywords: [
        `${c.name.toLowerCase()} hourly to salary`,
        `convert hourly wage to salary ${c.slug}`,
        `${c.name.toLowerCase()} hourly take home pay`,
      ],
      formulaExplanation: `Annual Gross = Hourly Rate × Hours Per Week × 52 Weeks. Net Pay is calculated after applying 2026 federal, state, and ${c.name} local taxes.`,
      workedExamples: [
        {
          title: `$40/hr in ${c.name}`,
          inputSummary: `$40/hr at 40 hours per week = $83,200 annual gross salary in ${c.name}.`,
          resultSummary: `Calculates exact bi-weekly net paycheck after all federal and municipal deductions.`,
        },
      ],
      faqs: [
        {
          question: `How many working hours are in a year for ${c.name} workers?`,
          answer: `Standard full-time employment equals 2,080 hours per year (40 hours/week × 52 weeks).`,
        },
      ],
      faq: [{ q: "Can I adjust weekly hours?", a: "Yes, you can adjust weekly hours from 1 to 80." }],
      relatedSlugs: [`${c.slug}-paycheck-calculator`, `${c.slug}-overtime-pay-calculator`],
    });

    // 4. City Overtime Pay Calculator
    programmaticList.push({
      id: `prog-${c.slug}-overtime-pay-calculator`,
      slug: `${c.slug}-overtime-pay-calculator`,
      name: `${c.name} Overtime Pay Calculator`,
      title: `${c.name} Overtime Pay Calculator (1.5x Time & a Half Take-Home)`,
      shortDesc: `Calculate overtime earnings and net take-home pay in ${c.name}, ${c.stateCode} with time-and-a-half (1.5x) and municipal tax withholding.`,
      seoTitle: `${c.name} Overtime Calculator 2026 – Time and a Half Pay`,
      metaDescription: `Calculate your overtime pay in ${c.name}, ${c.stateCode}. Factor 1.5x rate and municipal tax withholding. 100% private.`,
      category: "finance",
      group: "US City Paycheck & Local Taxes",
      region: "US",
      cpcTier: "medium",
      engineType: "native",
      componentKey: "city-tax-paycheck-engine",
      preset: { citySlug: c.slug, calcMode: "overtime" },
      status: "live",
      indexable: true,
      isWasm: false,
      trending: false,
      publishWave: 2,
      keywords: [
        `${c.name.toLowerCase()} overtime calculator`,
        `${c.slug} time and a half pay`,
        `overtime tax rate ${c.name.toLowerCase()}`,
      ],
      formulaExplanation: `Overtime Rate = Regular Hourly Rate × 1.5. Total Pay = Base Hours Pay + Overtime Hours Pay, less tax withholdings.`,
      workedExamples: [
        {
          title: `10 Overtime Hours at $30/hr Base in ${c.name}`,
          inputSummary: `$30/hr base rate, 40 regular hours + 10 OT hours ($45/hr OT rate).`,
          resultSummary: `Gross weekly pay increases from $1,200 to $1,650 ($450 gross OT boost).`,
        },
      ],
      faqs: [
        {
          question: `Is overtime taxed at a higher rate in ${c.name}?`,
          answer: `Overtime pay is taxed as ordinary income. While payroll software may withhold at a higher supplemental rate temporarily, your true annual tax bracket determines the final tax owed.`,
        },
      ],
      faq: [{ q: "Does this cover FLSA standards?", a: "Yes, follows federal FLSA 1.5x standards." }],
      relatedSlugs: [`${c.slug}-paycheck-calculator`, `${c.slug}-hourly-to-salary-calculator`],
    });
  }

  // ==========================================
  // FAMILY 7: Investment & Crypto Engines
  // ==========================================
  for (const t of INVESTMENT_CRYPTO_TOOLS) {
    programmaticList.push({
      id: t.id,
      slug: t.slug,
      name: t.name,
      title: t.title,
      shortDesc: t.shortDesc,
      seoTitle: t.seoTitle,
      metaDescription: t.metaDescription,
      category: t.category,
      group: t.group,
      region: "GLOBAL",
      cpcTier: "high",
      engineType: "native",
      componentKey: "investment-crypto-engine",
      preset: { calcType: t.calcType },
      status: "live",
      indexable: true,
      isWasm: false,
      trending: ["bitcoin-dca-calculator", "ethereum-staking-rewards-calculator", "sp500-investment-growth-calculator"].includes(t.slug),
      publishWave: 2,
      keywords: t.keywords,
      formulaExplanation: t.formulaExplanation,
      workedExamples: t.workedExamples,
      faqs: t.faqs,
      faq: [{ q: "Is any financial data uploaded or stored?", a: "Never. All calculations run strictly in your local browser sandbox." }],
      relatedSlugs: ["mortgage-calculator", "401k-retirement-calculator", "saas-metrics-calculator"],
    });
  }

  // ==========================================
  // FAMILY 8: Growth & E-Commerce Engines
  // ==========================================
  for (const g of GROWTH_ECOMMERCE_TOOLS) {
    programmaticList.push({
      id: g.id,
      slug: g.slug,
      name: g.name,
      title: g.title,
      shortDesc: g.shortDesc,
      seoTitle: g.seoTitle,
      metaDescription: g.metaDescription,
      category: g.category,
      group: g.group,
      region: "GLOBAL",
      cpcTier: "high",
      engineType: "native",
      componentKey: "growth-ecommerce-engine",
      preset: { calcType: g.calcType },
      status: "live",
      indexable: true,
      isWasm: false,
      trending: ["breakeven-roas-calculator", "target-cpa-calculator", "shopify-profit-margin-calculator"].includes(g.slug),
      publishWave: 2,
      keywords: g.keywords,
      formulaExplanation: g.formulaExplanation,
      workedExamples: g.workedExamples,
      faqs: g.faqs,
      faq: [{ q: "Are customer and order metrics private?", a: "100% private. No figures leave your browser." }],
      relatedSlugs: ["stripe-fee-calculator", "amazon-fba-calculator", "roas-cpa-calculator"],
    });
  }

  // ==========================================
  // FAMILY 9: Contractor & Freelance Engines
  // ==========================================
  for (const b of CONTRACTOR_BILLING_TOOLS) {
    programmaticList.push({
      id: b.id,
      slug: b.slug,
      name: b.name,
      title: b.title,
      shortDesc: b.shortDesc,
      seoTitle: b.seoTitle,
      metaDescription: b.metaDescription,
      category: b.category,
      group: b.group,
      region: "GLOBAL",
      cpcTier: "high",
      engineType: "native",
      componentKey: "contractor-billing-engine",
      preset: { calcType: b.calcType },
      status: "live",
      indexable: true,
      isWasm: false,
      trending: ["freelance-hourly-rate-calculator", "w2-vs-1099-contractor-calculator"].includes(b.slug),
      publishWave: 2,
      keywords: b.keywords,
      formulaExplanation: b.formulaExplanation,
      workedExamples: b.workedExamples,
      faqs: b.faqs,
      faq: [{ q: "Is this updated for 2026 IRS tax rates?", a: "Yes, models 2026 self-employment tax and retirement limits." }],
      relatedSlugs: ["tax-1099-calculator", "invoice-pdf-generator", "freelance-nda-generator"],
    });
  }

  // ==========================================
  // FAMILY 10: High-Value Mortgage & Loan Engines
  // ==========================================
  programmaticList.push({
    id: "prog-fha-loan-calculator",
    slug: "fha-loan-calculator",
    name: "FHA Loan Calculator",
    title: "FHA Loan Calculator (Upfront & Annual MIP Monthly Payment Formula)",
    shortDesc: "Calculate monthly FHA mortgage payments, 1.75% Upfront MIP, and 0.55% annual mortgage insurance. Model exact 3.5% down payment loan terms.",
    seoTitle: "FHA Loan Calculator 2026 – Upfront & Monthly MIP Formula",
    metaDescription: "Calculate monthly FHA mortgage payments, 1.75% Upfront MIP, and 0.55% annual mortgage insurance. Model exact 3.5% down payment loan terms. Free.",
    category: "real-estate",
    group: "Mortgage & Property Finance",
    region: "US",
    cpcTier: "high",
    engineType: "native",
    componentKey: "fha-loan-engine",
    status: "live",
    indexable: true,
    isWasm: false,
    trending: true,
    publishWave: 2,
    keywords: [
      "fha loan calculator",
      "fha mortgage payment calculator",
      "fha mip calculator",
      "upfront mip calculator",
      "fha monthly payment formula",
      "3.5 down payment calculator",
    ],
    formulaExplanation: "Total Monthly Payment = Principal & Interest(Base Loan × 1.0175) + [(Base Loan × 0.0055) / 12].",
    workedExamples: [
      {
        title: "$350,000 Purchase at 3.5% Down (6.5% Rate)",
        inputSummary: "$350k price, $12,250 down payment, 6.5% 30-year fixed rate.",
        resultSummary: "Monthly P&I: $2,172.18, Monthly MIP: $154.80. Total monthly housing payment is $2,326.98.",
      },
    ],
    faqs: [
      {
        question: "What is the minimum down payment for an FHA loan?",
        answer: "3.5% for borrowers with a credit score of 580 or higher (10% for credit scores between 500 and 579).",
      },
      {
        question: "Does FHA MIP ever cancel?",
        answer: "If you put down less than 10%, annual MIP persists for the full 30-year life of the loan unless refinanced into a conventional loan.",
      },
    ],
    faq: [{ q: "Does this calculation upload my personal housing data?", a: "No, all amortization and MIP calculations execute 100% locally in your browser." }],
    relatedSlugs: ["mortgage-calculator", "rent-vs-buy", "rental-roi-calculator"],
  });

  return programmaticList;
}
