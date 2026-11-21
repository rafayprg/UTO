import { US_STATES } from "@/data/programmatic/us-states";
import { TIER1_COUNTRIES } from "@/data/programmatic/tier1-countries";
import { PAYMENT_PLATFORMS } from "@/data/programmatic/payment-platforms";
import { UNIT_PAIRS } from "@/data/programmatic/unit-pairs";
import { FORMAT_PAIRS } from "@/data/programmatic/format-pairs";
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

  return programmaticList;
}
