export interface InvestmentCryptoToolData {
  id: string;
  slug: string;
  name: string;
  title: string;
  shortDesc: string;
  seoTitle: string;
  metaDescription: string;
  category: "finance";
  group: "Crypto & Wealth Engines";
  calcType:
    | "dca"
    | "staking"
    | "crypto-pnl"
    | "crypto-tax"
    | "liquidation"
    | "impermanent-loss"
    | "halving-roi"
    | "drip"
    | "sp500-growth"
    | "ira-compare"
    | "hysa"
    | "stock-options"
    | "fire"
    | "capital-gains"
    | "backdoor-roth"
    | "cash-on-cash"
    | "cd-ladder";
  assetOrTheme: string;
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

export const INVESTMENT_CRYPTO_TOOLS: InvestmentCryptoToolData[] = [
  {
    id: "prog-bitcoin-dca-calculator",
    slug: "bitcoin-dca-calculator",
    name: "Bitcoin DCA Calculator",
    title: "Bitcoin DCA Calculator (Dollar-Cost Averaging ROI & Yield)",
    shortDesc: "Simulate recurring daily, weekly, or monthly Bitcoin purchases to calculate average purchase price, total sats accumulated, and ROI.",
    seoTitle: "Bitcoin DCA Calculator 2026 – Dollar Cost Average Simulator",
    metaDescription: "Free Bitcoin DCA calculator. Simulate recurring Bitcoin purchases, average entry price, total sats stacked, and portfolio returns. 100% private.",
    category: "finance",
    group: "Crypto & Wealth Engines",
    calcType: "dca",
    assetOrTheme: "BTC",
    defaultInputs: {
      recurringAmount: 100,
      frequency: "weekly", // daily, weekly, biweekly, monthly
      durationMonths: 24,
      startingBtcPrice: 65000,
      annualGrowthRate: 25,
    },
    formulaExplanation: "Total Invested = Recurring Amount × Total Periods. Average Buy Price = Total Invested / Total BTC Accumulated. Final Value = Total BTC × Projected End Price.",
    workedExamples: [
      {
        title: "$100/Week Bitcoin DCA over 2 Years",
        inputSummary: "$100 invested every week for 104 weeks ($10,400 total cash invested).",
        resultSummary: "Accumulates ~0.142 BTC at an average cost of $73,200 with substantial downside protection compared to lump-sum timing.",
      },
    ],
    faqs: [
      {
        question: "Why is Dollar Cost Averaging (DCA) recommended for Bitcoin?",
        answer: "DCA removes emotion and market-timing risk by systematically purchasing at regular intervals, naturally averaging out crypto volatility.",
      },
      {
        question: "How often should I DCA into Bitcoin?",
        answer: "Weekly and bi-weekly frequencies align well with typical payroll cycles while minimizing transaction fee overhead.",
      },
    ],
    keywords: ["bitcoin dca calculator", "btc dollar cost averaging", "stack sats calculator", "crypto dca simulator"],
  },
  {
    id: "prog-ethereum-staking-rewards-calculator",
    slug: "ethereum-staking-rewards-calculator",
    name: "Ethereum Staking Calculator",
    title: "Ethereum Staking Calculator (ETH Staking Yield & Rewards)",
    shortDesc: "Calculate annual ETH staking rewards, compounding validator APY, post-merge consensus & execution tips, and dollar earnings.",
    seoTitle: "Ethereum Staking Calculator 2026 – ETH APY & Validator Yield",
    metaDescription: "Calculate Ethereum staking rewards. Free 2026 validator and pool APY calculator with compound rewards and USD projections. 100% private.",
    category: "finance",
    group: "Crypto & Wealth Engines",
    calcType: "staking",
    assetOrTheme: "ETH",
    defaultInputs: {
      ethAmount: 32,
      baseApy: 3.8, // %
      mevTipApy: 0.8, // %
      compounding: true,
      timeHorizonYears: 3,
      ethPriceUsd: 3400,
    },
    formulaExplanation: "Total APY = Consensus Yield + MEV Tips − Pool Fee. Annual Reward = ETH Staked × (Total APY / 100). Compounded Value = P × (1 + r)^t.",
    workedExamples: [
      {
        title: "32 ETH Solo Validator for 3 Years",
        inputSummary: "32 ETH staked at 4.6% net combined APY with compounding rewards.",
        resultSummary: "Earns ~4.62 ETH in total rewards ($15,700+ at $3,400/ETH) over 36 months.",
      },
    ],
    faqs: [
      {
        question: "What is the average APY for Ethereum staking in 2026?",
        answer: "Ethereum staking APY generally ranges from 3.2% to 4.8% annualized, depending on network validator count and on-chain gas priority/MEV fees.",
      },
      {
        question: "What is the difference between solo staking and liquid staking?",
        answer: "Solo staking requires exactly 32 ETH and running your own node with 0% protocol fee. Liquid staking (e.g. Lido, Rocket Pool) allows any amount with a 5-10% fee cut.",
      },
    ],
    keywords: ["ethereum staking calculator", "eth staking rewards", "eth validator apy", "crypto staking return"],
  },
  {
    id: "prog-crypto-profit-loss-calculator",
    slug: "crypto-profit-loss-calculator",
    name: "Crypto Profit & Loss Calculator",
    title: "Crypto Profit / Loss Calculator (Entry, Exit & Exchange Fees)",
    shortDesc: "Calculate net profit or loss from crypto trades including maker/taker exchange fees and percentage ROI.",
    seoTitle: "Crypto Profit Calculator – Trade Gain/Loss with Exchange Fees",
    metaDescription: "Calculate exact net profit, loss percentage, and exchange fees for cryptocurrency trades. Supports long/short trades with zero signup.",
    category: "finance",
    group: "Crypto & Wealth Engines",
    calcType: "crypto-pnl",
    assetOrTheme: "Multi-Crypto",
    defaultInputs: {
      initialInvestment: 5000,
      buyPrice: 62000,
      sellPrice: 88000,
      exchangeFeeRate: 0.1, // 0.1% maker/taker
    },
    formulaExplanation: "Coin Units = (Investment − Buy Fee) / Buy Price. Gross Exit = Coin Units × Sell Price. Net Profit = Gross Exit − Sell Fee − Initial Investment.",
    workedExamples: [
      {
        title: "$5,000 BTC Trade from $62,000 to $88,000",
        inputSummary: "$5,000 invested at $62k entry, exited at $88k with 0.1% fee.",
        resultSummary: "Gross exit value is $7,096.77 with $12.10 total exchange fees, resulting in +$2,084.67 net profit (+41.69% ROI).",
      },
    ],
    faqs: [
      {
        question: "How do exchange fees affect crypto net profit?",
        answer: "Exchange fees are charged on both the purchase and sale. High frequency trades with 0.4% or higher taker fees can erode significant percentage gains.",
      },
    ],
    keywords: ["crypto profit calculator", "crypto pnl calculator", "bitcoin profit calculator", "cryptocurrency exit profit"],
  },
  {
    id: "prog-crypto-capital-gains-tax-calculator",
    slug: "crypto-capital-gains-tax-calculator",
    name: "Crypto Capital Gains Tax Calculator",
    title: "Crypto Capital Gains Tax Calculator (Short-Term vs Long-Term)",
    shortDesc: "Estimate taxable crypto gains, IRS short-term vs long-term tax brackets, and net after-tax proceeds.",
    seoTitle: "Crypto Capital Gains Tax Calculator 2026 – IRS Short vs Long-Term",
    metaDescription: "Calculate 2026 IRS crypto capital gains taxes. Compare short-term income rates vs 0%/15%/20% long-term rates. 100% private.",
    category: "finance",
    group: "Crypto & Wealth Engines",
    calcType: "crypto-tax",
    assetOrTheme: "US Taxes",
    defaultInputs: {
      totalGains: 25000,
      holdingPeriod: "long", // "short" or "long"
      annualIncome: 95000,
      filingStatus: "single",
      stateTaxRate: 5.0,
    },
    formulaExplanation: "Long-Term (> 1 year): 0%, 15%, or 20% federal bracket + state capital gains. Short-Term (≤ 1 year): taxed as ordinary federal income bracket.",
    workedExamples: [
      {
        title: "$25,000 Long-Term Crypto Gain on $95,000 Income",
        inputSummary: "$25,000 gain held over 12 months, Single filer with $95k ordinary salary.",
        resultSummary: "Subject to 15% Federal Long-Term rate ($3,750) + 5% State ($1,250) = $5,000 total tax (20% total rate), keeping $20,000 clean profit.",
      },
    ],
    faqs: [
      {
        question: "Are crypto-to-crypto swaps taxable events in the United States?",
        answer: "Yes. Swapping BTC for ETH or stablecoins is treated by the IRS as a sale of property at fair market value and triggers capital gains tax.",
      },
      {
        question: "What is the threshold for 0% long-term capital gains?",
        answer: "For 2026, single filers with total taxable income under approximately $47,025 pay 0% federal tax on long-term capital gains.",
      },
    ],
    keywords: ["crypto tax calculator", "cryptocurrency capital gains tax", "bitcoin tax rate", "short term vs long term crypto tax"],
  },
  {
    id: "prog-crypto-liquidation-calculator",
    slug: "crypto-liquidation-calculator",
    name: "Crypto Futures Liquidation Calculator",
    title: "Crypto Futures Liquidation Price Calculator (Leverage & Margin)",
    shortDesc: "Calculate exact liquidation price, bankruptcy price, and maintenance margin threshold for Isolated and Cross leverage trades.",
    seoTitle: "Crypto Liquidation Price Calculator – Isolated & Cross Futures Margin",
    metaDescription: "Calculate crypto futures liquidation price across 2x to 100x leverage. Accurately model maintenance margin and avoid wipeouts. 100% private.",
    category: "finance",
    group: "Crypto & Wealth Engines",
    calcType: "liquidation",
    assetOrTheme: "Derivatives",
    defaultInputs: {
      positionType: "long", // long or short
      entryPrice: 65000,
      leverage: 10,
      maintenanceMarginRate: 0.5, // 0.5%
    },
    formulaExplanation: "Long Liquidation = Entry Price × (1 − (1 / Leverage) + Maintenance Margin Rate). Short Liquidation = Entry Price × (1 + (1 / Leverage) − Maintenance Margin Rate).",
    workedExamples: [
      {
        title: "10x Long on Bitcoin at $65,000 Entry",
        inputSummary: "Isolated 10x leverage long position with 0.5% maintenance margin requirement.",
        resultSummary: "Liquidation triggers at $58,825. A drop of only 9.5% liquidates the entire margin without an active stop loss.",
      },
    ],
    faqs: [
      {
        question: "What is maintenance margin in crypto perpetuals?",
        answer: "Maintenance margin is the minimum margin balance required to keep a leveraged position open. Dropping below this triggers automatic liquidation.",
      },
    ],
    keywords: ["crypto liquidation calculator", "bitcoin leverage liquidation price", "binance bybit liquidation formula", "futures margin calculator"],
  },
  {
    id: "prog-defi-impermanent-loss-calculator",
    slug: "defi-impermanent-loss-calculator",
    name: "DeFi Impermanent Loss Calculator",
    title: "DeFi Impermanent Loss Calculator (Uniswap V2 / V3 AMM Pools)",
    shortDesc: "Calculate the exact impermanent loss percentage and net yield when providing liquidity to automated market maker (AMM) decentralized exchange pools.",
    seoTitle: "DeFi Impermanent Loss Calculator – Uniswap LP Yield & IL Matrix",
    metaDescription: "Calculate exact impermanent loss for liquidity provider (LP) pools. Compare holding vs LP fees earned. 100% free client-side tool.",
    category: "finance",
    group: "Crypto & Wealth Engines",
    calcType: "impermanent-loss",
    assetOrTheme: "DeFi",
    defaultInputs: {
      initialPriceRatio: 1,
      priceChangePercentAssetA: 100, // asset doubles (+100%)
      tradingFeeApy: 18, // 18% fee yield earned
      holdingPeriodDays: 180,
    },
    formulaExplanation: "Price Ratio k = P_new / P_old. IL = 2 × sqrt(k) / (1 + k) − 1. Net Outcome = (1 + IL) × (1 + Fee Yield) − 1.",
    workedExamples: [
      {
        title: "Asset A doubles (+100% price surge)",
        inputSummary: "Token A rises 100% while Token B remains stable (2x relative ratio).",
        resultSummary: "Impermanent loss is −5.72%. If trading fees generated +9% during the period, net LP profit is +2.76% above simply holding the 50/50 portfolio.",
      },
    ],
    faqs: [
      {
        question: "When does impermanent loss become permanent?",
        answer: "Impermanent loss becomes permanent the moment you remove your liquidity from the AMM pool. If prices return to their original ratio, IL drops back to 0%.",
      },
    ],
    keywords: ["impermanent loss calculator", "uniswap lp calculator", "defi yield vs il", "amm liquidity pool loss"],
  },
  {
    id: "prog-dividend-reinvestment-drip-calculator",
    slug: "dividend-reinvestment-drip-calculator",
    name: "Dividend Reinvestment (DRIP) Calculator",
    title: "Dividend Reinvestment (DRIP) Calculator (Compound Yield & Growth)",
    shortDesc: "Simulate dividend snowball effect: reinvest quarterly or annual dividends to project share accumulation, yield on cost, and total portfolio value.",
    seoTitle: "Dividend Reinvestment Calculator (DRIP) – Compound Yield Simulator",
    metaDescription: "Free DRIP dividend reinvestment calculator. Project the snowball effect of compounding dividends, share growth, and yield on cost. 100% private.",
    category: "finance",
    group: "Crypto & Wealth Engines",
    calcType: "drip",
    assetOrTheme: "Stocks & ETFs",
    defaultInputs: {
      initialInvestment: 25000,
      annualContribution: 6000,
      dividendYield: 3.5, // %
      dividendGrowthRate: 5.0, // % annual dividend increase
      stockPriceAppreciation: 6.0, // %
      investmentHorizonYears: 20,
    },
    formulaExplanation: "Annual Cashflow = Shares × (Dividend Per Share). Reinvested Shares = Annual Dividend / Current Share Price. Portfolio Value compounded annually with DRIP.",
    workedExamples: [
      {
        title: "$25,000 initial + $500/mo over 20 years with DRIP",
        inputSummary: "$25k starting, $6k/yr contributions, 3.5% initial yield growing at 5%/yr, 6% share price growth.",
        resultSummary: "Grows into a ~$486,000 portfolio yielding over $24,800/yr in purely passive cash dividends (Yield on Cost ~17.1%).",
      },
    ],
    faqs: [
      {
        question: "What is 'Yield on Cost' in dividend investing?",
        answer: "Yield on Cost is the current annual dividend income divided by your original purchase cost basis. With dividend growth and DRIP, yield on cost often surpasses 10%–20%.",
      },
    ],
    keywords: ["drip calculator", "dividend reinvestment calculator", "dividend snowball calculator", "compound dividend yield"],
  },
  {
    id: "prog-sp500-investment-growth-calculator",
    slug: "sp500-investment-growth-calculator",
    name: "S&P 500 Historical Growth Calculator",
    title: "S&P 500 Compound Growth Calculator (Historical Index Returns)",
    shortDesc: "Project your index fund wealth based on historical S&P 500 average annualized returns (10% nominal, 7% inflation-adjusted) with monthly deposits.",
    seoTitle: "S&P 500 Return Calculator – Historical Index Compound Growth",
    metaDescription: "Calculate S&P 500 index fund returns with monthly contributions. Toggle nominal vs inflation-adjusted real returns. 100% private.",
    category: "finance",
    group: "Crypto & Wealth Engines",
    calcType: "sp500-growth",
    assetOrTheme: "Index Funds",
    defaultInputs: {
      startingPrincipal: 10000,
      monthlyDeposit: 500,
      annualReturnRate: 10.2, // historical nominal average
      inflationRate: 2.5,
      yearsToGrow: 25,
      adjustForInflation: true,
    },
    formulaExplanation: "Future Value FV = P(1+r)^t + PMT × [((1+r)^t − 1) / r]. Real Rate = (1 + Nominal) / (1 + Inflation) − 1.",
    workedExamples: [
      {
        title: "$10,000 + $500/mo for 25 Years in S&P 500",
        inputSummary: "25-year horizon at 10.2% average return, adjusted for 2.5% inflation.",
        resultSummary: "Total invested: $160,000. Real purchasing power value reaches ~$428,000 (Nominal gross balance reaches ~$712,000).",
      },
    ],
    faqs: [
      {
        question: "What is the historical average annual return of the S&P 500?",
        answer: "Since 1926, the S&P 500 has produced an average nominal annualized return of approximately 10.2% to 10.5%, or roughly 7% real return after inflation.",
      },
    ],
    keywords: ["sp 500 calculator", "index fund return calculator", "compound interest calculator sp500", "voo return simulator"],
  },
  {
    id: "prog-roth-vs-traditional-ira-calculator",
    slug: "roth-vs-traditional-ira-calculator",
    name: "Roth vs Traditional IRA Calculator",
    title: "Roth vs Traditional IRA Calculator (Tax-Free vs Tax-Deferred)",
    shortDesc: "Compare retirement take-home wealth between paying taxes today (Roth) vs paying taxes in retirement (Traditional) across career tax brackets.",
    seoTitle: "Roth vs Traditional IRA Calculator 2026 – Compare Take-Home Wealth",
    metaDescription: "Compare Roth IRA vs Traditional IRA retirement outcomes based on your current tax bracket vs expected retirement bracket. 100% private.",
    category: "finance",
    group: "Crypto & Wealth Engines",
    calcType: "ira-compare",
    assetOrTheme: "Retirement",
    defaultInputs: {
      annualContribution: 7000,
      currentAge: 30,
      retirementAge: 65,
      currentTaxBracket: 24, // %
      retirementTaxBracket: 15, // %
      expectedAnnualReturn: 8.0,
    },
    formulaExplanation: "Roth End Balance = Net Post-Tax Investment compounded tax-free with $0 retirement tax. Traditional End Balance = Full Gross Investment compounded, taxed at retirement bracket.",
    workedExamples: [
      {
        title: "Age 30 to 65: Maxing $7,000/year",
        inputSummary: "35 years compounding at 8% return. Current tax bracket: 24%; Retirement tax bracket: 15%.",
        resultSummary: "Traditional IRA yields higher net retirement income by ~$94,000 due to significant tax arbitrage (saving at 24% and withdrawing at 15%).",
      },
    ],
    faqs: [
      {
        question: "When is a Roth IRA better than a Traditional IRA?",
        answer: "A Roth IRA is better when you expect your income tax bracket in retirement to be higher than your current bracket, or if you want penalty-free flexibility on principal withdrawals.",
      },
    ],
    keywords: ["roth vs traditional ira calculator", "ira tax comparison calculator", "roth ira retirement calculator", "traditional ira tax savings"],
  },
  {
    id: "prog-fire-retirement-number-calculator",
    slug: "fire-retirement-number-calculator",
    name: "FIRE Calculator (Financial Independence)",
    title: "FIRE Number Calculator (LeanFIRE, FatFIRE & Safe Withdrawal Rate)",
    shortDesc: "Calculate your exact Financial Independence (FIRE) portfolio target using the 4% Rule, annual living expenses, and years until retirement.",
    seoTitle: "FIRE Calculator 2026 – Calculate Your Financial Independence Number",
    metaDescription: "Free FIRE calculator. Calculate your exact net worth target for early retirement using 3%-4% safe withdrawal rates. 100% private.",
    category: "finance",
    group: "Crypto & Wealth Engines",
    calcType: "fire",
    assetOrTheme: "Early Retirement",
    defaultInputs: {
      annualExpenses: 60000,
      safeWithdrawalRate: 4.0, // 4% rule (multiplier = 25x)
      currentNetWorth: 120000,
      monthlySavings: 2500,
      portfolioReturnRate: 8.0,
      inflationRate: 2.5,
    },
    formulaExplanation: "FIRE Number = Annual Living Expenses / (Safe Withdrawal Rate / 100). At 4% SWR, FIRE Number = 25 × Annual Expenses.",
    workedExamples: [
      {
        title: "$60,000/yr Living Expenses at 4% SWR",
        inputSummary: "$60k annual budget, saving $2,500/mo starting with $120k net worth.",
        resultSummary: "Target FIRE Number is $1,500,000. Reached in approximately 16.4 years with an 8% market return.",
      },
    ],
    faqs: [
      {
        question: "What is the 4% Rule in retirement planning?",
        answer: "The 4% Rule (originating from the Trinity Study) states that a retiree can safely withdraw 4% of their initial portfolio value in year 1, adjusted for inflation annually, with minimal risk of depletion over 30 years.",
      },
    ],
    keywords: ["fire calculator", "financial independence retire early calculator", "4 percent rule calculator", "leanfire number calculator"],
  },
  {
    id: "prog-capital-gains-tax-calculator",
    slug: "capital-gains-tax-calculator",
    name: "Capital Gains Tax Calculator",
    title: "Capital Gains Tax Calculator (Federal & State Tax Liability)",
    shortDesc: "Calculate total taxes owed on stocks, real estate, and asset sales for both short-term ordinary income and long-term 0%/15%/20% preferential rates.",
    seoTitle: "Capital Gains Tax Calculator 2026 – Federal & State Asset Sale Tax",
    metaDescription: "Free capital gains tax calculator for 2026. Calculate short-term vs long-term taxes on stock sales and investments by US state. 100% private.",
    category: "finance",
    group: "Crypto & Wealth Engines",
    calcType: "capital-gains",
    assetOrTheme: "Taxation",
    defaultInputs: {
      purchasePrice: 40000,
      salePrice: 110000,
      holdingMonths: 18,
      annualTaxableIncome: 120000,
      filingStatus: "single",
      stateCode: "CA",
    },
    formulaExplanation: "Capital Gain = Sale Price − Cost Basis. If holding > 12 months: Long-Term IRS rates (0%, 15%, 20%) + NIIT (3.8% if applicable) + State Income Tax.",
    workedExamples: [
      {
        title: "$70,000 Long-Term Stock Gain in California",
        inputSummary: "Bought for $40k, sold for $110k after 18 months. $120k salary in California.",
        resultSummary: "Federal Long-Term Tax (15%): $10,500. California State Tax (~9.3%): $6,510. Total Tax: $17,010. Net Proceeds: $92,990.",
      },
    ],
    faqs: [
      {
        question: "What is the Net Investment Income Tax (NIIT)?",
        answer: "NIIT is an additional 3.8% Medicare surtax that applies to net investment income for single filers with MAGI exceeding $200,000 ($250,000 for married couples).",
      },
    ],
    keywords: ["capital gains tax calculator", "stock sale tax calculator", "long term capital gains brackets 2026", "california capital gains tax"],
  },
  {
    id: "prog-real-estate-cash-on-cash-calculator",
    slug: "real-estate-cash-on-cash-calculator",
    name: "Real Estate Cash-on-Cash Return Calculator",
    title: "Cash-on-Cash Return Calculator (Rental Property Cap Rate & CoC ROI)",
    shortDesc: "Calculate rental property net operating income (NOI), Cap Rate, debt service, and Cash-on-Cash (CoC) return on total invested capital.",
    seoTitle: "Cash on Cash Return Calculator – Rental Property Cap Rate & Cash Flow",
    metaDescription: "Calculate cash on cash return and cap rate for rental properties. Factor down payment, mortgage, maintenance, and vacancy. 100% private.",
    category: "finance",
    group: "Crypto & Wealth Engines",
    calcType: "cash-on-cash",
    assetOrTheme: "Real Estate",
    defaultInputs: {
      purchasePrice: 350000,
      downPaymentPercent: 20,
      closingCosts: 8000,
      initialRepairs: 12000,
      monthlyGrossRent: 3100,
      operatingExpenseRatio: 40, // % of gross rent (property mgmt, taxes, insurance, repairs, vacancy)
      annualMortgagePayment: 20400,
    },
    formulaExplanation: "Cash-on-Cash Return = (Annual Pre-Tax Cash Flow / Total Cash Invested) × 100. Total Cash Invested = Down Payment + Closing Costs + Initial Repairs.",
    workedExamples: [
      {
        title: "$350,000 Rental with 20% Down",
        inputSummary: "$70k down + $20k closing/rehab ($90k cash invested). $3,100/mo rent with 40% expenses and $1,700/mo mortgage.",
        resultSummary: "Annual Net Cash Flow is $1,920 ($160/mo). Cash-on-Cash return is 2.13% cash yield, plus tenant debt paydown and equity appreciation.",
      },
    ],
    faqs: [
      {
        question: "What is a good Cash-on-Cash return for rental property?",
        answer: "Most real estate investors target between 8% and 12% cash-on-cash return, although lower rates (4-7%) are common in high-appreciation coastal markets.",
      },
    ],
    keywords: ["cash on cash return calculator", "rental property roi calculator", "cap rate calculator real estate", "investment property cash flow"],
  },
];
