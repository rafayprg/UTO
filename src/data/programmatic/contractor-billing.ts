export interface ContractorBillingToolData {
  id: string;
  slug: string;
  name: string;
  title: string;
  shortDesc: string;
  seoTitle: string;
  metaDescription: string;
  category: "business";
  group: "Contractor & Freelance Engines";
  calcType:
    | "freelance-rate"
    | "w2-vs-1099"
    | "retainer-pricing"
    | "scope-pricing"
    | "late-invoice-interest"
    | "billable-hours"
    | "subcontractor-markup"
    | "sep-ira-solo-401k";
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

export const CONTRACTOR_BILLING_TOOLS: ContractorBillingToolData[] = [
  {
    id: "prog-freelance-hourly-rate-calculator",
    slug: "freelance-hourly-rate-calculator",
    name: "Freelance Hourly Rate Calculator",
    title: "Freelance Hourly Rate Calculator (Target Take-Home, Taxes & Overhead)",
    shortDesc: "Reverse-engineer your minimum hourly rate to hit your desired annual take-home pay after self-employment taxes (15.3%), health insurance, unpaid vacation, and non-billable overhead.",
    seoTitle: "Freelance Hourly Rate Calculator – Set Profitable Client Rates",
    metaDescription: "Calculate your ideal freelance hourly rate based on target net income, billable utilization (60-70%), self-employment tax, and business expenses. 100% private.",
    category: "business",
    group: "Contractor & Freelance Engines",
    calcType: "freelance-rate",
    defaultInputs: {
      desiredNetIncome: 85000,
      annualBusinessExpenses: 12000, // software, laptop, insurance, accountant
      healthInsuranceAnnual: 6000,
      selfEmploymentTaxRate: 15.3,
      incomeTaxEffectiveRate: 14.0,
      weeksVacationAndSick: 4,
      billableHoursPerWeek: 25, // 25 billable hours / 40 total work hours
    },
    formulaExplanation: "Total Required Gross = (Desired Income + Expenses + Health) / (1 − (SE Tax + Income Tax)). Total Billable Hours = (52 − Vacation Weeks) × Billable Hours/Wk. Minimum Rate = Required Gross / Billable Hours.",
    workedExamples: [
      {
        title: "$85,000 Net Income with 4 Weeks Off and 25 Billable Hours/Week",
        inputSummary: "$85k target net, $18k overhead/health, 29.3% total taxes, 1,200 annual billable hours.",
        resultSummary: "Required gross revenue is ~$145,700. Minimum billable hourly rate is $121.40/hr.",
      },
    ],
    faqs: [
      {
        question: "Why should freelancers only count 20–25 billable hours per week?",
        answer: "A standard 40-hour freelance work week typically includes 15–20 hours of non-billable administrative work: client proposals, invoicing, marketing, emails, and professional development.",
      },
      {
        question: "How does the Self-Employment (SE) tax work?",
        answer: "In the US, independent contractors pay both the employer and employee portions of Social Security and Medicare (total 15.3% on 92.35% of net profit), though half is tax-deductible.",
      },
    ],
    keywords: ["freelance hourly rate calculator", "contractor rate calculator", "how much to charge per hour freelance", "freelance pricing formula"],
  },
  {
    id: "prog-w2-vs-1099-contractor-calculator",
    slug: "w2-vs-1099-contractor-calculator",
    name: "W-2 Employee vs 1099 Contractor Calculator",
    title: "W-2 vs 1099 Salary Equivalent Calculator (Benefits & Tax Offset)",
    shortDesc: "Determine the exact 1099 contractor hourly rate or salary required to match a W-2 employment offer once 401(k) matches, health insurance, paid time off, and payroll taxes are equalized.",
    seoTitle: "W2 vs 1099 Calculator 2026 – Compare Salary vs Contractor Rates",
    metaDescription: "Calculate the exact 1099 contractor rate equivalent to your W-2 salary offer. Account for employer FICA match, PTO, and benefits. 100% private.",
    category: "business",
    group: "Contractor & Freelance Engines",
    calcType: "w2-vs-1099",
    defaultInputs: {
      w2Salary: 100000,
      w2HealthBenefitValue: 8000,
      w2Employer401kMatch: 4000,
      w2PaidDaysOff: 20, // vacation + holidays
      contractorExpenses: 5000,
    },
    formulaExplanation: "1099 Equivalent = W-2 Base + Health Insurance + 401k Match + Employer FICA (7.65%) + Value of Paid Days Off + Business Overhead.",
    workedExamples: [
      {
        title: "$100,000 W-2 Job vs 1099 Contract Offer",
        inputSummary: "$100k salary, $8k health benefits, $4k 401k match, 20 paid vacation days, $5k contract overhead.",
        resultSummary: "Equivalent 1099 gross billing needed is $132,350/yr (or ~$70.75/hr across 1,870 billable hours) to maintain identical net cash flow and benefits.",
      },
    ],
    faqs: [
      {
        question: "What is the typical rule of thumb when switching from W-2 to 1099?",
        answer: "The general rule of thumb is that a 1099 contractor rate should be 30% to 50% higher than the equivalent W-2 hourly rate to cover additional self-employment taxes, insurance, and unpaid time off.",
      },
    ],
    keywords: ["w2 vs 1099 calculator", "contractor vs employee pay calculator", "1099 salary equivalent", "w2 to 1099 hourly rate conversion"],
  },
  {
    id: "prog-monthly-retainer-pricing-calculator",
    slug: "monthly-retainer-pricing-calculator",
    name: "Monthly Retainer Pricing Calculator",
    title: "Monthly Retainer Pricing Calculator (Guaranteed Availability & Discount)",
    shortDesc: "Calculate profitable monthly recurring retainers for agencies and consultants: balance guaranteed revenue stability against discounted hourly commitments and rollover limits.",
    seoTitle: "Monthly Retainer Pricing Calculator – Agency & Freelance Retainer Rates",
    metaDescription: "Calculate agency and freelance monthly retainer packages. Model committed hours, retainer discounts (10-20%), and rollover terms. 100% private.",
    category: "business",
    group: "Contractor & Freelance Engines",
    calcType: "retainer-pricing",
    defaultInputs: {
      standardHourlyRate: 150,
      committedMonthlyHours: 20,
      retainerDiscountPercent: 12, // 12% discount for upfront guaranteed monthly cash
      overageHourlyRate: 175, // premium for extra hours beyond scope
    },
    formulaExplanation: "Base Retainer Fee = Committed Hours × Standard Rate × (1 − Discount %). Guaranteed Effective Hourly = Base Retainer / Committed Hours. Overage Fee = Overage Hours × Overage Rate.",
    workedExamples: [
      {
        title: "20 Hours/Month Retainer at $150/hr Standard Rate",
        inputSummary: "20 hours committed, 12% retainer discount, $175/hr overage rate.",
        resultSummary: "Fixed monthly retainer invoice is $2,640/mo ($132/hr effective). Provides predictable recurring revenue while locking client priority.",
      },
    ],
    faqs: [
      {
        question: "Should retainer hours roll over to the next month?",
        answer: "Generally no. 'Use-it-or-lose-it' retainers preserve consultant capacity and prevent clients from hoarding 50 hours into one overwhelming month.",
      },
    ],
    keywords: ["retainer pricing calculator", "agency monthly retainer calculator", "freelance retainer rate formula", "consulting retainer agreement"],
  },
  {
    id: "prog-late-invoice-interest-calculator",
    slug: "late-invoice-interest-calculator",
    name: "Late Invoice Interest & Penalty Calculator",
    title: "Late Payment Interest Calculator (Statutory & Contractual Penalties)",
    shortDesc: "Calculate overdue invoice interest charges, statutory late payment compensation fees, and annualized late fee penalties according to contract terms.",
    seoTitle: "Late Invoice Interest Calculator – Overdue Payment Penalty & Statutory Fees",
    metaDescription: "Calculate legal late payment interest and fees on overdue client invoices. Factor 1.5%/month terms or statutory rates. 100% private.",
    category: "business",
    group: "Contractor & Freelance Engines",
    calcType: "late-invoice-interest",
    defaultInputs: {
      invoiceAmount: 6500,
      annualInterestRate: 18.0, // standard 1.5% per month = 18% annual
      daysOverdue: 45,
      flatLateFee: 50,
    },
    formulaExplanation: "Daily Interest Rate = Annual Rate / 365. Total Interest = Invoice Amount × Daily Rate × Days Overdue. Total Owed = Invoice + Total Interest + Late Fee.",
    workedExamples: [
      {
        title: "$6,500 Invoice 45 Days Past Due at 1.5%/mo (18% APR)",
        inputSummary: "$6,500 balance, 45 days late, 18% annual contract interest + $50 standard late notice fee.",
        resultSummary: "Accrued interest is $144.25 plus $50 late fee. Total updated collection balance is $6,694.25.",
      },
    ],
    faqs: [
      {
        question: "What is the legal standard late fee percentage in the US?",
        answer: "Commercial contracts typically stipulate 1.5% per month (18% annualized) as a reasonable late payment interest charge without violating state usury laws.",
      },
    ],
    keywords: ["late invoice interest calculator", "overdue payment interest formula", "contractor late payment fee", "statutory interest calculator"],
  },
  {
    id: "prog-sep-ira-solo-401k-calculator",
    slug: "sep-ira-solo-401k-calculator",
    name: "Solo 401(k) & SEP IRA Contribution Calculator",
    title: "Solo 401(k) vs SEP IRA Calculator (2026 Maximum Contribution Limits)",
    shortDesc: "Calculate maximum allowable tax-deductible retirement contributions for self-employed sole proprietors, LLC owners, and S-Corp shareholders under 2026 IRS limits.",
    seoTitle: "Solo 401k vs SEP IRA Calculator 2026 – Max Self-Employed Contribution",
    metaDescription: "Calculate 2026 Solo 401(k) and SEP IRA maximum contribution limits. Compare employee elective deferrals and 25% employer profit sharing. 100% private.",
    category: "business",
    group: "Contractor & Freelance Engines",
    calcType: "sep-ira-solo-401k",
    defaultInputs: {
      netSelfEmploymentProfit: 120000,
      age: 42,
      businessStructure: "sole_proprietor", // sole_proprietor or s_corp
      w2WageSCorp: 70000,
    },
    formulaExplanation: "Solo 401k Max = Elective Employee Deferral ($23,500 / $31,000 if 50+) + Employer Profit Share (20% of net self-employment or 25% of S-Corp W-2) up to $69,000+ total cap.",
    workedExamples: [
      {
        title: "$120,000 Net Profit for Sole Proprietor (Under 50)",
        inputSummary: "$120k net self-employment earnings, single owner under age 50.",
        resultSummary: "Can contribute $23,500 employee deferral + ~$22,298 employer profit sharing = $45,798 total tax-sheltered contribution in a Solo 401(k) (vs only $22,298 in a standard SEP IRA).",
      },
    ],
    faqs: [
      {
        question: "Why does a Solo 401(k) allow higher contributions than a SEP IRA at lower income levels?",
        answer: "A Solo 401(k) allows both the employee elective deferral ($23,500) AND the employer profit-sharing portion (20%-25%), whereas a SEP IRA only allows employer contributions.",
      },
    ],
    keywords: ["solo 401k calculator", "sep ira contribution calculator 2026", "self employed retirement contribution limits", "solo 401k vs sep ira maximum"],
  },
];
