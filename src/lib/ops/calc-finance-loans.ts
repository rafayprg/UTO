import type { CalcOp } from "./types";
import { FINANCE_NOTE, field, num, pct, select, usd } from "./calc-finance-core.ts";

export interface AmortRow { month: number; payment: number; interest: number; principal: number; balance: number }

const MAX_MONTHS = 600;
const TABLE_CAP = 360;

/** Fixed monthly payment for a fully amortizing loan. */
export function monthlyPayment(principal: number, annualRate: number, months: number): number {
  const r = annualRate / 12;
  return r === 0 ? principal / months : principal * r / (1 - (1 + r) ** -months);
}

/** Month-by-month schedule; `extra` is paid on top of the regular payment each month. */
export function amortize(principal: number, annualRate: number, months: number, extra = 0): AmortRow[] {
  const r = annualRate / 12;
  const base = monthlyPayment(principal, annualRate, months);
  const rows: AmortRow[] = [];
  let balance = principal;
  for (let month = 1; month <= months && balance > 0.005; month += 1) {
    const interest = balance * r;
    const due = Math.min(base + extra, balance + interest);
    balance = Math.max(0, balance + interest - due);
    rows.push({ month, payment: due, interest, principal: due - interest, balance });
  }
  return rows;
}

const sum = (rows: AmortRow[], key: "interest" | "payment" | "principal") => rows.reduce((total, row) => total + row[key], 0);

function yearlyRows(rows: AmortRow[]): string[][] {
  const years = Math.ceil(rows.length / 12);
  return Array.from({ length: years }, (_, index) => {
    const slice = rows.slice(index * 12, index * 12 + 12);
    return [String(index + 1), usd(sum(slice, "principal")), usd(sum(slice, "interest")), usd(slice[slice.length - 1].balance)];
  });
}

function loanInputs(v: Record<string, string>) {
  const principal = num(v.principal, "the loan amount", { above: 0 });
  const rate = num(v.rate, "the interest rate", { min: 0, max: 100 }) / 100;
  return { principal, rate };
}

const termMonths = (value: string | undefined, unit: string | undefined) => {
  const term = num(value, "the loan term", { above: 0 });
  const months = Math.round(unit === "years" ? term * 12 : term);
  if (months < 1 || months > MAX_MONTHS) throw new Error(`The loan term must be between 1 and ${MAX_MONTHS} months (50 years).`);
  return months;
};

export const loanOps: Record<string, CalcOp> = {
  "loan-emi": {
    fields: [
      field("principal", "Loan amount (USD)", "20000"),
      field("rate", "Annual interest rate (%)", "8", { step: "0.01" }),
      field("term", "Loan term", "60", { step: "1" }),
      select("unit", "Term unit", "months", [["months", "Months"], ["years", "Years"]]),
    ],
    note: `${FINANCE_NOTE} Fixed-rate loan with equal monthly payments; fees are not included. The table shows up to ${TABLE_CAP} months.`,
    compute(v) {
      const { principal, rate } = loanInputs(v);
      const months = termMonths(v.term, v.unit);
      const rows = amortize(principal, rate, months);
      const interest = sum(rows, "interest");
      return {
        results: [
          { label: "Monthly payment (EMI)", value: usd(monthlyPayment(principal, rate, months)), primary: true },
          { label: "Total interest", value: usd(interest) },
          { label: "Total paid", value: usd(principal + interest) },
        ],
        formula: "EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), r = annual rate ÷ 12",
        table: {
          head: ["Month", "Payment", "Principal", "Interest", "Balance"],
          rows: rows.slice(0, TABLE_CAP).map(row => [String(row.month), usd(row.payment), usd(row.principal), usd(row.interest), usd(row.balance)]),
        },
      };
    },
  },
  "loan-amortization": {
    fields: [
      field("principal", "Loan amount (USD)", "150000"),
      field("rate", "Annual interest rate (%)", "6", { step: "0.01" }),
      field("years", "Loan term (years)", "20"),
      field("extra", "Extra payment each month (USD)", "100", { step: "0.01" }),
    ],
    note: `${FINANCE_NOTE} Yearly summary of a fixed-rate loan; extra payments go straight to principal.`,
    compute(v) {
      const { principal, rate } = loanInputs(v);
      const months = termMonths(v.years, "years");
      const extra = num(v.extra || "0", "the extra payment", { min: 0 });
      const regular = amortize(principal, rate, months);
      const faster = amortize(principal, rate, months, extra);
      const saved = sum(regular, "interest") - sum(faster, "interest");
      return {
        results: [
          { label: "Regular monthly payment", value: usd(monthlyPayment(principal, rate, months)), primary: true },
          { label: "Payoff time with extra payment", value: `${Math.floor(faster.length / 12)} yr ${faster.length % 12} mo` },
          { label: "Total interest with extra payment", value: usd(sum(faster, "interest")) },
          { label: "Interest saved", value: usd(saved) },
        ],
        formula: "Each month: interest = balance × rate ÷ 12; principal = payment − interest",
        table: { head: ["Year", "Principal paid", "Interest paid", "End balance"], rows: yearlyRows(faster) },
      };
    },
  },
  mortgage: {
    fields: [
      field("price", "Home price (USD)", "400000"),
      field("down", "Down payment (USD)", "80000"),
      field("rate", "Annual interest rate (%)", "6.5", { step: "0.01", hint: "Use the rate from your lender's quote." }),
      select("years", "Loan term", "30", [["10", "10 years"], ["15", "15 years"], ["20", "20 years"], ["25", "25 years"], ["30", "30 years"]]),
      field("tax", "Property tax per year (USD, optional)", "0"),
      field("insurance", "Home insurance per year (USD, optional)", "0"),
      field("hoa", "HOA fees per month (USD, optional)", "0"),
    ],
    note: `${FINANCE_NOTE} Principal and interest for a fixed-rate loan; PMI and closing costs are not included.`,
    compute(v) {
      const price = num(v.price, "the home price", { above: 0 });
      const down = num(v.down, "the down payment", { min: 0 });
      if (down >= price) throw new Error("The down payment must be less than the home price.");
      const rate = num(v.rate, "the interest rate", { min: 0, max: 100 }) / 100;
      const months = termMonths(v.years, "years");
      const extras = (num(v.tax || "0", "the property tax", { min: 0 }) + num(v.insurance || "0", "the insurance", { min: 0 })) / 12 + num(v.hoa || "0", "the HOA fees", { min: 0 });
      const principal = price - down;
      const payment = monthlyPayment(principal, rate, months);
      const rows = amortize(principal, rate, months);
      return {
        results: [
          { label: "Total monthly payment", value: usd(payment + extras), primary: true },
          { label: "Principal & interest", value: usd(payment) },
          { label: "Taxes, insurance & HOA per month", value: usd(extras) },
          { label: "Loan amount", value: usd(principal) },
          { label: "Down payment", value: pct(down / price, 1) },
          { label: "Total interest", value: usd(sum(rows, "interest")) },
        ],
        formula: "M = P × r × (1 + r)^n ÷ ((1 + r)^n − 1)",
        table: { head: ["Year", "Principal paid", "Interest paid", "End balance"], rows: yearlyRows(rows) },
      };
    },
  },
  "credit-card-payoff": {
    fields: [
      field("balance", "Card balance (USD)", "5000", { step: "0.01" }),
      field("apr", "APR (%)", "22", { step: "0.01" }),
      select("mode", "Calculate", "payment", [["payment", "Time to pay off with a fixed payment"], ["months", "Payment needed to pay off in a set time"]]),
      field("payment", "Monthly payment (USD)", "200", { step: "0.01", hint: "Used for “time to pay off”." }),
      field("months", "Target months", "24", { step: "1", hint: "Used for “payment needed”." }),
    ],
    note: `${FINANCE_NOTE} Assumes no new purchases, a constant APR and interest charged monthly at APR ÷ 12.`,
    compute(v) {
      const balance = num(v.balance, "the balance", { above: 0 });
      const apr = num(v.apr, "the APR", { min: 0, max: 100 }) / 100;
      if (v.mode === "months") {
        const months = num(v.months, "the target months", { min: 1, max: MAX_MONTHS, integer: true });
        const payment = monthlyPayment(balance, apr, months);
        return {
          results: [{ label: "Monthly payment needed", value: usd(payment), primary: true }, { label: "Total interest", value: usd(payment * months - balance) }, { label: "Total paid", value: usd(payment * months) }],
          formula: "payment = B × r ÷ (1 − (1 + r)^−n), r = APR ÷ 12",
        };
      }
      const payment = num(v.payment, "the monthly payment", { above: 0 });
      if (payment <= balance * apr / 12) throw new Error(`The payment must be more than the first month's interest (${usd(balance * apr / 12)}), or the balance never goes down.`);
      const rows = simulate(balance, apr, payment);
      return {
        results: [
          { label: "Months to pay off", value: `${rows.months} (${Math.floor(rows.months / 12)} yr ${rows.months % 12} mo)`, primary: true },
          { label: "Total interest", value: usd(rows.interest) },
          { label: "Total paid", value: usd(balance + rows.interest) },
        ],
        formula: "Each month: interest = balance × APR ÷ 12; balance = balance + interest − payment",
      };
    },
  },
  "loan-affordability": {
    fields: [
      field("payment", "Monthly payment you can afford (USD)", "1500"),
      field("rate", "Annual interest rate (%)", "7", { step: "0.01" }),
      field("years", "Loan term (years)", "30"),
    ],
    note: FINANCE_NOTE,
    compute(v) {
      const payment = num(v.payment, "the monthly payment", { above: 0 });
      const rate = num(v.rate, "the interest rate", { min: 0, max: 100 }) / 100;
      const months = termMonths(v.years, "years");
      const r = rate / 12;
      const principal = r === 0 ? payment * months : payment * (1 - (1 + r) ** -months) / r;
      return {
        results: [{ label: "Maximum loan amount", value: usd(principal), primary: true }, { label: "Total interest over the term", value: usd(payment * months - principal) }, { label: "Total paid", value: usd(payment * months) }],
        formula: "P = M × (1 − (1 + r)^−n) ÷ r",
      };
    },
  },
  "debt-to-income": {
    fields: [field("debt", "Total monthly debt payments (USD)", "1800", { hint: "Rent or mortgage, car, student loans, card minimums…" }), field("income", "Gross monthly income (USD)", "6000")],
    note: `${FINANCE_NOTE} Lenders set their own DTI limits and may count debts differently.`,
    compute(v) {
      const debt = num(v.debt, "the monthly debt", { min: 0 });
      const income = num(v.income, "the monthly income", { above: 0 });
      return {
        results: [{ label: "Debt-to-income ratio", value: pct(debt / income, 1), primary: true }, { label: "Income left after debt payments", value: usd(income - debt) }, { label: "Yearly debt payments", value: usd(debt * 12) }],
        formula: "DTI = monthly debt payments ÷ gross monthly income",
      };
    },
  },
};

function simulate(balance: number, apr: number, payment: number): { months: number; interest: number } {
  let remaining = balance;
  let interest = 0;
  let months = 0;
  while (remaining > 0.005) {
    if (months >= MAX_MONTHS) throw new Error(`Payoff would take more than ${MAX_MONTHS / 12} years. Increase the payment.`);
    const charge = remaining * apr / 12;
    interest += charge;
    remaining = Math.max(0, remaining + charge - payment);
    months += 1;
  }
  return { months, interest };
}

