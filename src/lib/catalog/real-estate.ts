import type { CatalogEntry } from "./types";

export const realEstateCatalog: CatalogEntry[] = [
  {
    "slug": "fha-loan-calculator",
    "title": "FHA Loan Calculator",
    "shortDesc": "Estimate monthly FHA mortgage payments with 3.5% down payment and upfront/monthly MIP.",
    "keywords": [
      "fha loan",
      "fha mortgage",
      "mip insurance"
    ],
    "group": "Government & Specialized Mortgages",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "fha-loan-calculator"
  },
  {
    "slug": "va-loan-calculator",
    "title": "VA Loan Calculator",
    "shortDesc": "Calculate VA home loan monthly payments with 0% down payment and zero monthly PMI.",
    "keywords": [
      "va loan",
      "veterans mortgage",
      "zero down loan"
    ],
    "group": "Government & Specialized Mortgages",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "va-loan-calculator"
  },
  {
    "slug": "heloc-payment-calculator",
    "title": "HELOC Payment Calculator",
    "shortDesc": "Calculate monthly payments during the 10-year draw and 20-year repayment phases.",
    "keywords": [
      "heloc calculator",
      "home equity line of credit",
      "equity loan"
    ],
    "group": "Home Equity & Financing",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "heloc-payment-calculator"
  },
  {
    "slug": "commercial-cap-rate-calculator",
    "title": "Commercial Real Estate Cap Rate Calculator",
    "shortDesc": "Calculate capitalization rate from Net Operating Income (NOI) and property value.",
    "keywords": [
      "cap rate calculator",
      "commercial real estate",
      "noi"
    ],
    "group": "Investment & Valuation",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "commercial-cap-rate-calculator"
  },
  {
    "slug": "gross-rent-multiplier-calculator",
    "title": "Gross Rent Multiplier (GRM) Calculator",
    "shortDesc": "Evaluate rental property purchase price relative to gross annual rental income.",
    "keywords": [
      "gross rent multiplier",
      "grm calculator",
      "rental property valuation"
    ],
    "group": "Investment & Valuation",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "gross-rent-multiplier-calculator"
  },
  {
    "slug": "cash-on-cash-return-calculator",
    "title": "Cash-on-Cash Return Calculator",
    "shortDesc": "Determine annual pre-tax return on total out-of-pocket cash invested in rental properties.",
    "keywords": [
      "cash on cash return",
      "real estate roi",
      "rental cash flow"
    ],
    "group": "Investment & Valuation",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "cash-on-cash-return-calculator"
  },
  {
    "slug": "closing-costs-estimator",
    "title": "Mortgage Closing Costs Estimator",
    "shortDesc": "Estimate buyer closing costs, lender origination fees, appraisal, and title insurance.",
    "keywords": [
      "closing costs estimator",
      "home purchase costs",
      "lender fees"
    ],
    "group": "Home Equity & Financing",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "closing-costs-estimator"
  },
  {
    "slug": "amortization-schedule-calculator",
    "title": "Mortgage Amortization Schedule Calculator",
    "shortDesc": "Generate monthly P&I breakdown and complete annual loan amortization schedule table.",
    "keywords": [
      "amortization schedule",
      "mortgage table",
      "loan paydown schedule"
    ],
    "group": "Home Equity & Financing",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "amortization-schedule-calculator"
  },
  {
    "slug": "property-tax-estimator",
    "title": "Property Tax & Millage Rate Estimator",
    "shortDesc": "Calculate annual and monthly escrow property taxes using county assessed values and millage.",
    "keywords": [
      "property tax estimator",
      "millage rate",
      "county real estate tax"
    ],
    "group": "Taxes & Closing Costs",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "property-tax-estimator"
  },
  {
    "slug": "rental-yield-calculator",
    "title": "Gross & Net Rental Yield Calculator",
    "shortDesc": "Calculate gross rental yield and net rental yield after property taxes, HOA, and maintenance.",
    "keywords": [
      "rental yield",
      "gross yield",
      "net rental yield"
    ],
    "group": "Investment & Valuation",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "rental-yield-calculator"
  },
  {
    "slug": "refinance-breakeven-calculator",
    "title": "Mortgage Refinance Breakeven Calculator",
    "shortDesc": "Determine monthly payment reduction and exact months required to recoup closing costs.",
    "keywords": [
      "refinance breakeven",
      "refinance calculator",
      "mortgage savings"
    ],
    "group": "Home Equity & Financing",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "refinance-breakeven-calculator"
  },
  {
    "slug": "exchange-1031-tax-deferral",
    "title": "1031 Exchange Capital Gains Deferral Calculator",
    "shortDesc": "Calculate federal capital gains and 25% depreciation recapture tax deferred under Section 1031.",
    "keywords": [
      "1031 exchange",
      "tax deferral",
      "depreciation recapture 1031"
    ],
    "group": "Taxes & Closing Costs",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "exchange-1031-tax-deferral"
  },
  {
    "slug": "fix-and-flip-profit",
    "title": "Fix and Flip Profit & ROI Underwriting Calculator",
    "shortDesc": "Underwrite house flips including hard money holding costs, rehab expenses, and net profit.",
    "keywords": [
      "fix and flip",
      "flip profit",
      "rehab underwriting"
    ],
    "group": "Investment & Valuation",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "fix-and-flip-profit"
  },
  {
    "slug": "airbnb-vs-longterm",
    "title": "Airbnb Vacation Rental vs Long-Term Rental Calculator",
    "shortDesc": "Compare net monthly cash flow between short-term vacation rental (STR) and long-term rental.",
    "keywords": [
      "airbnb vs longterm",
      "str vs ltr",
      "vacation rental cash flow"
    ],
    "group": "Investment & Valuation",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "airbnb-vs-longterm"
  },
  {
    "slug": "dti-ratio-calculator",
    "title": "Debt-to-Income (DTI) Mortgage Qualification Calculator",
    "shortDesc": "Calculate front-end housing and back-end total debt ratios against Fannie Mae standards.",
    "keywords": [
      "dti calculator",
      "debt to income",
      "mortgage qualifying ratio"
    ],
    "group": "Home Equity & Financing",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "dti-ratio-calculator"
  },
  {
    "slug": "brrrr-strategy-calculator",
    "title": "BRRRR Real Estate Investment Calculator",
    "shortDesc": "Underwrite the complete BRRRR loop: Buy, Rehab, Rent, Refinance, and capital returned.",
    "keywords": [
      "brrrr calculator",
      "brrrr strategy",
      "cash out refi rental"
    ],
    "group": "Investment & Valuation",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "brrrr-strategy-calculator"
  },
  {
    "slug": "down-payment-timeline",
    "title": "Home Down Payment Savings Horizon Calculator",
    "shortDesc": "Calculate months required to save your home down payment with compounding high-yield savings.",
    "keywords": [
      "down payment savings",
      "home savings timeline",
      "down payment horizon"
    ],
    "group": "Home Equity & Financing",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "down-payment-timeline"
  },
  {
    "slug": "land-transfer-tax-estimator",
    "title": "Land Transfer Tax & Stamp Duty Estimator",
    "shortDesc": "Estimate municipal and state deed transfer taxes and first-time homebuyer rebates.",
    "keywords": [
      "land transfer tax",
      "stamp duty",
      "real estate transfer tax"
    ],
    "group": "Taxes & Closing Costs",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "land-transfer-tax-estimator"
  },
  {
    "slug": "rent-vs-buy-equity",
    "title": "Rent vs Buy Wealth & Equity Calculator",
    "shortDesc": "Project home equity accumulation and appreciation against sunk renting expenses over time.",
    "keywords": [
      "rent vs buy",
      "home equity build",
      "buying vs renting"
    ],
    "group": "Home Equity & Financing",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "rent-vs-buy-equity"
  },
  {
    "slug": "hoa-fee-purchasing-power",
    "title": "HOA Fee Purchasing Power Impact Calculator",
    "shortDesc": "Determine how much mortgage borrowing capacity is reduced by monthly condo and HOA dues.",
    "keywords": [
      "hoa fee impact",
      "condo fee purchasing power",
      "borrowing power hoa"
    ],
    "group": "Home Equity & Financing",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "hoa-fee-purchasing-power"
  },
  {
    "slug": "mortgage-apr-vs-rate",
    "title": "Mortgage APR vs Note Interest Rate Calculator",
    "shortDesc": "Calculate true Annual Percentage Rate (APR) factoring in upfront points and lender fees.",
    "keywords": [
      "apr vs interest rate",
      "mortgage apr",
      "true cost of credit"
    ],
    "group": "Home Equity & Financing",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "mortgage-apr-vs-rate"
  },
  {
    "slug": "biweekly-mortgage-savings",
    "title": "Bi-Weekly Mortgage Payment Savings Calculator",
    "shortDesc": "Calculate interest saved and years shaved off your mortgage by paying every two weeks.",
    "keywords": [
      "biweekly mortgage",
      "26 half payments",
      "accelerated mortgage payoff"
    ],
    "group": "Home Equity & Financing",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "biweekly-mortgage-savings"
  },
  {
    "slug": "rule-70-house-flipping",
    "title": "70% Rule House Flipping Calculator (MAO)",
    "shortDesc": "Calculate Maximum Allowable Offer (MAO) for distressed properties using the 70% ARV rule.",
    "keywords": [
      "70% rule",
      "mao calculator",
      "maximum allowable offer"
    ],
    "group": "Investment & Valuation",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "rule-70-house-flipping"
  },
  {
    "slug": "prorated-rent-calculator",
    "title": "Prorated Rent Move-In & Move-Out Calculator",
    "shortDesc": "Calculate daily rental rate and partial month rent due for move-in or lease break.",
    "keywords": [
      "prorated rent",
      "partial month rent",
      "daily rent calculator"
    ],
    "group": "Rental Property Management",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "prorated-rent-calculator"
  },
  {
    "slug": "operating-expense-ratio-oer",
    "title": "Operating Expense Ratio (OER) Calculator",
    "shortDesc": "Measure commercial and multifamily operational overhead efficiency against gross income.",
    "keywords": [
      "oer calculator",
      "operating expense ratio",
      "commercial property efficiency"
    ],
    "group": "Investment & Valuation",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "operating-expense-ratio-oer"
  },
  {
    "slug": "square-footage-price",
    "title": "Price Per Square Foot & Square Meter Calculator",
    "shortDesc": "Calculate $/sq ft and $/m² to evaluate real estate valuation and fair market pricing.",
    "keywords": [
      "price per sq ft",
      "price per square foot",
      "sq ft valuation"
    ],
    "group": "Investment & Valuation",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "square-footage-price"
  },
  {
    "slug": "property-management-fee",
    "title": "Property Management Fee & Lease-Up Calculator",
    "shortDesc": "Calculate monthly property management fees, tenant placement cost, and annual overhead.",
    "keywords": [
      "property management fee",
      "lease up fee",
      "landlord overhead"
    ],
    "group": "Rental Property Management",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "property-management-fee"
  },
  {
    "slug": "seller-net-sheet",
    "title": "Home Seller Net Proceeds Sheet Calculator",
    "shortDesc": "Estimate walk-away cash proceeds for home sellers after paying mortgage, agent fees, and title.",
    "keywords": [
      "seller net sheet",
      "seller proceeds",
      "closing proceeds"
    ],
    "group": "Taxes & Closing Costs",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "seller-net-sheet"
  },
  {
    "slug": "mortgage-points-breakeven",
    "title": "Mortgage Discount Points Breakeven Calculator",
    "shortDesc": "Calculate the exact months required to recoup the upfront cash cost of buying discount points.",
    "keywords": [
      "mortgage points breakeven",
      "discount points",
      "rate buydown"
    ],
    "group": "Home Equity & Financing",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "mortgage-points-breakeven"
  },
  {
    "slug": "home-equity-loan-vs-heloc",
    "title": "Fixed Home Equity Loan vs HELOC Calculator",
    "shortDesc": "Compare fixed second mortgage monthly payments against variable line-of-credit interest.",
    "keywords": [
      "heloc vs home equity loan",
      "second mortgage",
      "equity line comparison"
    ],
    "group": "Home Equity & Financing",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "home-equity-loan-vs-heloc"
  },
  {
    "slug": "real-estate-commission-split",
    "title": "Real Estate Commission & Agent Split Calculator",
    "shortDesc": "Calculate total commission, listing/buyer side split, and agent vs brokerage take-home.",
    "keywords": [
      "real estate commission",
      "agent broker split",
      "realtor fee calculator"
    ],
    "group": "Taxes & Closing Costs",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "real-estate-commission-split"
  },
  {
    "slug": "adu-roi-calculator",
    "title": "ADU (Accessory Dwelling Unit) ROI Calculator",
    "shortDesc": "Calculate rental cash flow, capitalization rate, and payback timeline for building an ADU.",
    "keywords": [
      "adu roi",
      "granny flat roi",
      "accessory dwelling unit return"
    ],
    "group": "Investment & Valuation",
    "engine": "calc",
    "module": "calc-realestate",
    "op": "adu-roi-calculator"
  }
];
