import type { CalcOp, CalcOutput } from "./types";
import { FINANCE_NOTE, amount, field, fmt, num, pct, select, usd } from "./calc-finance-core.ts";

const ADD_REMOVE: Array<[string, string]> = [["add", "Add tax to a net amount"], ["remove", "Remove tax from a gross amount"]];

function taxSplit(base: number, rate: number, mode: string, money: (value: number) => string, taxName: string): CalcOutput {
  const net = mode === "remove" ? base / (1 + rate) : base;
  const tax = net * rate;
  return {
    results: [
      { label: mode === "remove" ? `Net amount (excl. ${taxName})` : `Gross amount (incl. ${taxName})`, value: money(mode === "remove" ? net : net + tax), primary: true },
      { label: `${taxName} amount`, value: money(tax) },
      { label: mode === "remove" ? `Gross amount (incl. ${taxName})` : `Net amount (excl. ${taxName})`, value: money(mode === "remove" ? base : net) },
    ],
    formula: mode === "remove" ? `net = gross ÷ (1 + rate); ${taxName} = gross − net` : `${taxName} = net × rate; gross = net + ${taxName}`,
  };
}

function paymentFeeOp(provider: string, rate: string, fixed: string): CalcOp {
  return {
    fields: [
      field("amount", "Amount (USD)", "100", { step: "0.01" }),
      field("rate", "Percentage fee (%)", rate, { step: "0.01", hint: "Editable example. Check your actual rate." }),
      field("fixed", "Fixed fee per transaction (USD)", fixed, { step: "0.01" }),
      select("mode", "I want to know", "charge", [["charge", "What I receive from this charge"], ["receive", "What to charge to receive this amount"]]),
    ],
    note: `The default rate and fixed fee are editable examples, not official figures. Check ${provider}'s current pricing for your country, card type and currency; international, currency-conversion and other fees are not included.`,
    compute(v) {
      const value = num(v.amount, "the amount", { above: 0 });
      const r = num(v.rate, "the percentage fee", { min: 0, max: 99 }) / 100;
      const fixedFee = num(v.fixed, "the fixed fee", { min: 0 });
      if (v.mode === "receive") {
        const gross = (value + fixedFee) / (1 - r);
        return {
          results: [
            { label: "Amount to charge", value: usd(gross), primary: true },
            { label: "Fee", value: usd(gross - value) },
            { label: "You receive", value: usd(value) },
          ],
          formula: "charge = (amount + fixed fee) ÷ (1 − rate)",
        };
      }
      const fee = value * r + fixedFee;
      if (fee >= value) throw new Error("The fee is larger than the amount.");
      return {
        results: [
          { label: "You receive", value: usd(value - fee), primary: true },
          { label: "Fee", value: usd(fee) },
          { label: "Effective fee rate", value: pct(fee / value) },
        ],
        formula: "fee = amount × rate + fixed fee",
      };
    },
  };
}

export const businessOps: Record<string, CalcOp> = {
  "profit-margin": {
    fields: [field("cost", "Cost (USD)", "60", { step: "0.01" }), field("revenue", "Selling price or revenue (USD)", "100", { step: "0.01" })],
    compute(v) {
      const cost = num(v.cost, "the cost", { min: 0 });
      const revenue = num(v.revenue, "the revenue", { above: 0 });
      const profit = revenue - cost;
      return {
        results: [
          { label: "Profit margin", value: pct(profit / revenue), primary: true },
          { label: "Gross profit", value: usd(profit) },
          { label: "Markup", value: cost > 0 ? pct(profit / cost) : "Undefined (zero cost)" },
        ],
        formula: "margin = (revenue − cost) ÷ revenue",
      };
    },
  },
  markup: {
    fields: [field("cost", "Cost (USD)", "40", { step: "0.01" }), field("markup", "Markup (%)", "50", { step: "0.1" })],
    compute(v) {
      const cost = num(v.cost, "the cost", { above: 0 });
      const markup = num(v.markup, "the markup", { min: 0 }) / 100;
      const price = cost * (1 + markup);
      return {
        results: [
          { label: "Selling price", value: usd(price), primary: true },
          { label: "Profit per unit", value: usd(price - cost) },
          { label: "Profit margin", value: pct((price - cost) / price) },
        ],
        formula: "price = cost × (1 + markup)",
      };
    },
  },
  "margin-markup": {
    fields: [
      select("direction", "Convert", "margin", [["margin", "Margin → markup"], ["markup", "Markup → margin"]]),
      field("value", "Percentage (%)", "25", { step: "0.1" }),
    ],
    compute(v) {
      if (v.direction === "markup") {
        const markup = num(v.value, "the markup", { min: 0 }) / 100;
        return { results: [{ label: "Equivalent margin", value: pct(markup / (1 + markup)), primary: true }, { label: "Markup", value: pct(markup) }], formula: "margin = markup ÷ (1 + markup)" };
      }
      const margin = num(v.value, "the margin", { min: 0 }) / 100;
      if (margin >= 1) throw new Error("A margin must be below 100% to convert to markup.");
      return { results: [{ label: "Equivalent markup", value: pct(margin / (1 - margin)), primary: true }, { label: "Margin", value: pct(margin) }], formula: "markup = margin ÷ (1 − margin)" };
    },
  },
  "price-from-margin": {
    fields: [field("cost", "Cost (USD)", "30", { step: "0.01" }), field("margin", "Target margin (%)", "40", { step: "0.1" })],
    compute(v) {
      const cost = num(v.cost, "the cost", { above: 0 });
      const margin = num(v.margin, "the target margin", { min: 0 }) / 100;
      if (margin >= 1) throw new Error("The target margin must be below 100%.");
      const price = cost / (1 - margin);
      return {
        results: [
          { label: "Selling price", value: usd(price), primary: true },
          { label: "Profit per unit", value: usd(price - cost) },
          { label: "Markup on cost", value: pct((price - cost) / cost) },
        ],
        formula: "price = cost ÷ (1 − margin)",
      };
    },
  },
  "freelance-rate": {
    fields: [
      field("income", "Target yearly income before tax (USD)", "80000"),
      field("expenses", "Yearly business expenses (USD)", "10000", { hint: "Software, equipment, insurance, workspace…" }),
      field("hours", "Billable hours per week", "25"),
      field("weeks", "Working weeks per year", "46", { hint: "52 minus vacation, holidays and sick days." }),
    ],
    note: FINANCE_NOTE,
    compute(v) {
      const income = num(v.income, "the income", { min: 0 });
      const expenses = num(v.expenses, "the expenses", { min: 0 });
      const hours = num(v.hours, "the billable hours", { above: 0, max: 168 });
      const weeks = num(v.weeks, "the working weeks", { above: 0, max: 52 });
      const billable = hours * weeks;
      const rate = (income + expenses) / billable;
      return {
        results: [
          { label: "Minimum hourly rate", value: usd(rate), primary: true },
          { label: "Day rate (billable hours ÷ 5)", value: usd(rate * hours / 5) },
          { label: "Billable hours per year", value: fmt(billable, 0) },
          { label: "Revenue needed per year", value: usd(income + expenses) },
        ],
        formula: "rate = (income + expenses) ÷ (billable hours per week × weeks)",
      };
    },
  },
  "break-even": {
    fields: [field("fixed", "Fixed costs (USD)", "5000"), field("price", "Price per unit (USD)", "50", { step: "0.01" }), field("variable", "Variable cost per unit (USD)", "30", { step: "0.01" })],
    compute(v) {
      const fixed = num(v.fixed, "the fixed costs", { min: 0 });
      const price = num(v.price, "the price", { above: 0 });
      const variable = num(v.variable, "the variable cost", { min: 0 });
      if (price <= variable) throw new Error("The price must be higher than the variable cost per unit, or you never break even.");
      const units = fixed / (price - variable);
      return {
        results: [
          { label: "Break-even units", value: fmt(Math.ceil(units - 1e-9), 0), primary: true },
          { label: "Exact break-even units", value: fmt(units, 2) },
          { label: "Break-even revenue", value: usd(units * price) },
          { label: "Contribution margin per unit", value: usd(price - variable) },
        ],
        formula: "units = fixed costs ÷ (price − variable cost)",
      };
    },
  },
  "contribution-margin": {
    fields: [field("price", "Price per unit (USD)", "80", { step: "0.01" }), field("variable", "Variable cost per unit (USD)", "48", { step: "0.01" }), field("units", "Units sold", "1000")],
    compute(v) {
      const price = num(v.price, "the price", { above: 0 });
      const variable = num(v.variable, "the variable cost", { min: 0 });
      const units = num(v.units, "the units", { min: 0 });
      const perUnit = price - variable;
      return {
        results: [
          { label: "Contribution margin per unit", value: usd(perUnit), primary: true },
          { label: "Contribution margin ratio", value: pct(perUnit / price) },
          { label: "Total contribution margin", value: usd(perUnit * units) },
        ],
        formula: "CM = price − variable cost; ratio = CM ÷ price",
      };
    },
  },
  commission: {
    fields: [field("sales", "Sale amount (USD)", "25000", { step: "0.01" }), field("rate", "Commission rate (%)", "5", { step: "0.01" }), field("base", "Base pay for the period (USD, optional)", "0")],
    compute(v) {
      const sales = num(v.sales, "the sale amount", { min: 0 });
      const rate = num(v.rate, "the commission rate", { min: 0, max: 100 }) / 100;
      const base = num(v.base || "0", "the base pay", { min: 0 });
      const commission = sales * rate;
      return {
        results: [{ label: "Commission", value: usd(commission), primary: true }, { label: "Total pay", value: usd(base + commission) }],
        formula: "commission = sale amount × rate",
      };
    },
  },
  discount: {
    fields: [field("price", "Original price (USD)", "120", { step: "0.01" }), field("discount", "Discount (%)", "25", { step: "0.1" }), field("extra", "Extra discount on the reduced price (%)", "0", { step: "0.1" })],
    compute(v) {
      const price = num(v.price, "the price", { min: 0 });
      const first = num(v.discount, "the discount", { min: 0, max: 100 }) / 100;
      const extra = num(v.extra || "0", "the extra discount", { min: 0, max: 100 }) / 100;
      const final = price * (1 - first) * (1 - extra);
      return {
        results: [
          { label: "Final price", value: usd(final), primary: true },
          { label: "You save", value: usd(price - final) },
          { label: "Effective discount", value: price > 0 ? pct((price - final) / price) : "0%" },
        ],
        formula: "final = price × (1 − discount) × (1 − extra discount)",
      };
    },
  },
  tip: {
    fields: [field("bill", "Bill amount (USD)", "86.40", { step: "0.01" }), field("tip", "Tip (%)", "18", { step: "0.5" }), field("people", "Split between people", "2", { step: "1" })],
    compute(v) {
      const bill = num(v.bill, "the bill", { min: 0 });
      const tip = num(v.tip, "the tip", { min: 0, max: 100 }) / 100;
      const people = num(v.people, "the number of people", { min: 1, integer: true, max: 1000 });
      const tipAmount = bill * tip;
      return {
        results: [
          { label: "Total per person", value: usd((bill + tipAmount) / people), primary: true },
          { label: "Tip", value: usd(tipAmount) },
          { label: "Total with tip", value: usd(bill + tipAmount) },
          { label: "Tip per person", value: usd(tipAmount / people) },
        ],
        formula: "tip = bill × tip %; per person = (bill + tip) ÷ people",
      };
    },
  },
  vat: {
    fields: [field("amount", "Amount", "100", { step: "0.01" }), field("rate", "VAT rate (%)", "20", { step: "0.01", hint: "Enter your country's rate." }), select("mode", "Calculation", "add", ADD_REMOVE)],
    note: "Amounts are currency-neutral. VAT rates vary by country and product; check the official rate that applies to you.",
    compute(v) {
      return taxSplit(num(v.amount, "the amount", { min: 0 }), num(v.rate, "the VAT rate", { min: 0, max: 100 }) / 100, v.mode, amount, "VAT");
    },
  },
  gst: {
    fields: [field("amount", "Amount", "1000", { step: "0.01" }), field("rate", "GST rate (%)", "18", { step: "0.01", hint: "Enter the rate that applies to the item." }), select("mode", "Calculation", "add", ADD_REMOVE)],
    note: "Amounts are currency-neutral. The CGST/SGST split shows the GST divided into two equal halves, as used for intra-state supplies in India. Check current official rates.",
    compute(v) {
      const base = num(v.amount, "the amount", { min: 0 });
      const rate = num(v.rate, "the GST rate", { min: 0, max: 100 }) / 100;
      const output = taxSplit(base, rate, v.mode, amount, "GST");
      const gst = v.mode === "remove" ? base - base / (1 + rate) : base * rate;
      return { ...output, results: [...output.results, { label: "CGST (half)", value: amount(gst / 2) }, { label: "SGST (half)", value: amount(gst / 2) }] };
    },
  },
  "sales-tax": {
    fields: [field("amount", "Price (USD)", "49.99", { step: "0.01" }), field("rate", "Sales tax rate (%)", "7", { step: "0.001", hint: "Combined state + local rate for your location." }), select("mode", "Calculation", "add", [["add", "Add tax to a pre-tax price"], ["remove", "Find the pre-tax price from a total"]])],
    note: "US sales tax rates vary by state, county and city. Look up the combined rate for the place of sale.",
    compute(v) {
      return taxSplit(num(v.amount, "the price", { min: 0 }), num(v.rate, "the sales tax rate", { min: 0, max: 100 }) / 100, v.mode, usd, "sales tax");
    },
  },
  "stripe-fee": paymentFeeOp("Stripe", "2.9", "0.30"),
  "paypal-fee": paymentFeeOp("PayPal", "3.49", "0.49"),
  "salary-to-hourly": {
    fields: [field("salary", "Yearly salary (USD)", "65000"), field("hours", "Hours per week", "40"), field("weeks", "Paid weeks per year", "52")],
    compute(v) {
      const salary = num(v.salary, "the salary", { min: 0 });
      const hours = num(v.hours, "the hours per week", { above: 0, max: 168 });
      const weeks = num(v.weeks, "the weeks per year", { above: 0, max: 52 });
      const hourly = salary / (hours * weeks);
      return {
        results: [
          { label: "Hourly rate", value: usd(hourly), primary: true },
          { label: "Daily (5-day week)", value: usd(salary / weeks / 5) },
          { label: "Weekly", value: usd(salary / weeks) },
          { label: "Biweekly", value: usd(salary / 26) },
          { label: "Semi-monthly", value: usd(salary / 24) },
          { label: "Monthly", value: usd(salary / 12) },
        ],
        formula: "hourly = salary ÷ (hours per week × weeks)",
      };
    },
  },
  "hourly-to-salary": {
    fields: [field("rate", "Hourly rate (USD)", "28.50", { step: "0.01" }), field("hours", "Hours per week", "40"), field("weeks", "Paid weeks per year", "52")],
    compute(v) {
      const rate = num(v.rate, "the hourly rate", { min: 0 });
      const hours = num(v.hours, "the hours per week", { above: 0, max: 168 });
      const weeks = num(v.weeks, "the weeks per year", { above: 0, max: 52 });
      const yearly = rate * hours * weeks;
      return {
        results: [
          { label: "Yearly salary", value: usd(yearly), primary: true },
          { label: "Monthly", value: usd(yearly / 12) },
          { label: "Biweekly", value: usd(yearly / 26) },
          { label: "Weekly", value: usd(rate * hours) },
        ],
        formula: "salary = hourly rate × hours per week × weeks",
      };
    },
  },
};
