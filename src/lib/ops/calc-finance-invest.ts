import type { CalcOp } from "./types";
import { FINANCE_NOTE, field, fmt, num, numberList, pct, select, textField, usd } from "./calc-finance-core.ts";

const COMPOUNDING: Array<[string, string]> = [["1", "Yearly"], ["2", "Semiannually"], ["4", "Quarterly"], ["12", "Monthly"], ["365", "Daily"]];

export const npvAt = (rate: number, flows: number[]) => flows.reduce((total, flow, t) => total + flow / (1 + rate) ** t, 0);
const npvSlope = (rate: number, flows: number[]) => flows.reduce((total, flow, t) => total - t * flow / (1 + rate) ** (t + 1), 0);

function bisect(flows: number[], low: number, high: number): number {
  let a = low;
  let b = high;
  for (let i = 0; i < 200; i += 1) {
    const mid = (a + b) / 2;
    if (Math.sign(npvAt(mid, flows)) === Math.sign(npvAt(a, flows))) a = mid; else b = mid;
  }
  return (a + b) / 2;
}

/** Internal rate of return: Newton's method, with a bracketing bisection fallback. Returns null when no rate exists. */
export function irr(flows: number[]): number | null {
  let rate = 0.1;
  for (let i = 0; i < 100; i += 1) {
    const slope = npvSlope(rate, flows);
    if (slope === 0 || !Number.isFinite(slope)) break;
    const next = rate - npvAt(rate, flows) / slope;
    if (!Number.isFinite(next) || next <= -1) break;
    if (Math.abs(next - rate) < 1e-12) return next;
    rate = next;
  }
  const grid = [-0.999, -0.99, -0.9, -0.75, -0.5, -0.25, 0, 0.05, 0.1, 0.2, 0.35, 0.5, 0.75, 1, 1.5, 2, 3, 5, 10, 100];
  for (let i = 0; i < grid.length - 1; i += 1) {
    const [a, b] = [npvAt(grid[i], flows), npvAt(grid[i + 1], flows)];
    if (a === 0) return grid[i];
    if (Math.sign(a) !== Math.sign(b)) return bisect(flows, grid[i], grid[i + 1]);
  }
  return null;
}

/** Years until the cumulative cash flow (optionally discounted) reaches zero, interpolated within the year. */
export function paybackYears(initial: number, flows: number[], rate = 0): number | null {
  let remaining = initial;
  for (let year = 0; year < flows.length; year += 1) {
    const flow = flows[year] / (1 + rate) ** (year + 1);
    if (flow > 0 && flow >= remaining) return year + remaining / flow;
    remaining -= flow;
  }
  return null;
}

const years = (value: string | undefined) => num(value, "the number of years", { min: 0, max: 1000 });

export const investOps: Record<string, CalcOp> = {
  "simple-interest": {
    fields: [field("principal", "Principal (USD)", "5000"), field("rate", "Annual interest rate (%)", "4", { step: "0.01" }), field("years", "Time (years)", "3", { step: "0.25" })],
    note: FINANCE_NOTE,
    compute(v) {
      const p = num(v.principal, "the principal", { min: 0 });
      const r = num(v.rate, "the rate", { min: 0 }) / 100;
      const interest = p * r * years(v.years);
      return { results: [{ label: "Interest", value: usd(interest), primary: true }, { label: "Total amount", value: usd(p + interest) }], formula: "I = P × r × t" };
    },
  },
  "savings-goal": {
    fields: [field("goal", "Savings goal (USD)", "20000"), field("current", "Already saved (USD)", "2000"), field("rate", "Expected annual return (%)", "4", { step: "0.01" }), field("years", "Years to reach the goal", "5")],
    note: `${FINANCE_NOTE} Assumes monthly deposits at the end of each month and monthly compounding at a constant rate.`,
    compute(v) {
      const goal = num(v.goal, "the goal", { above: 0 });
      const current = num(v.current || "0", "the amount saved", { min: 0 });
      const i = num(v.rate, "the return", { min: 0, max: 100 }) / 100 / 12;
      const n = Math.round(num(v.years, "the years", { above: 0, max: 100 }) * 12);
      if (n < 1) throw new Error("Use at least one month.");
      const grown = current * (1 + i) ** n;
      const gap = Math.max(0, goal - grown);
      const deposit = i === 0 ? gap / n : gap * i / ((1 + i) ** n - 1);
      return {
        results: [
          { label: "Monthly deposit needed", value: usd(deposit), primary: true },
          { label: "Total you deposit", value: usd(deposit * n) },
          { label: "Growth from returns", value: usd(Math.max(goal, grown) - current - deposit * n) },
        ],
        formula: "deposit = (goal − saved × (1 + i)^n) × i ÷ ((1 + i)^n − 1)",
      };
    },
  },
  roi: {
    fields: [field("cost", "Amount invested (USD)", "10000"), field("value", "Final value or return (USD)", "13500"), field("years", "Holding period in years (optional)", "3", { step: "0.25" })],
    note: FINANCE_NOTE,
    compute(v) {
      const cost = num(v.cost, "the amount invested", { above: 0 });
      const value = num(v.value, "the final value", { min: 0 });
      const t = num(v.years || "0", "the holding period", { min: 0 });
      const roi = (value - cost) / cost;
      return {
        results: [
          { label: "Return on investment", value: pct(roi), primary: true },
          { label: "Net gain", value: usd(value - cost) },
          { label: "Annualized ROI", value: t > 0 ? pct((value / cost) ** (1 / t) - 1) : "Enter a holding period" },
        ],
        formula: "ROI = (final value − cost) ÷ cost",
      };
    },
  },
  cagr: {
    fields: [field("start", "Beginning value (USD)", "10000"), field("end", "Ending value (USD)", "18000"), field("years", "Number of years", "5", { step: "0.25" })],
    note: FINANCE_NOTE,
    compute(v) {
      const start = num(v.start, "the beginning value", { above: 0 });
      const end = num(v.end, "the ending value", { min: 0 });
      const t = num(v.years, "the years", { above: 0 });
      return { results: [{ label: "CAGR", value: pct((end / start) ** (1 / t) - 1), primary: true }, { label: "Total growth", value: pct(end / start - 1) }], formula: "CAGR = (end ÷ start)^(1 ÷ years) − 1" };
    },
  },
  inflation: {
    fields: [field("amount", "Amount today (USD)", "1000"), field("rate", "Average yearly inflation (%)", "3", { step: "0.01", hint: "Enter your own assumption." }), field("years", "Years", "10")],
    note: `${FINANCE_NOTE} Uses the constant rate you enter, not historical data.`,
    compute(v) {
      const value = num(v.amount, "the amount", { min: 0 });
      const factor = (1 + num(v.rate, "the inflation rate", { min: -99, max: 1000 }) / 100) ** years(v.years);
      return {
        results: [
          { label: "Future cost of the same goods", value: usd(value * factor), primary: true },
          { label: "Future purchasing power of this amount", value: usd(value / factor) },
          { label: "Cumulative price change", value: pct(factor - 1) },
        ],
        formula: "future cost = amount × (1 + inflation)^years",
      };
    },
  },
  "present-value": {
    fields: [field("future", "Future value (USD)", "25000"), field("rate", "Annual discount rate (%)", "5", { step: "0.01" }), field("years", "Years", "8"), select("freq", "Compounding", "1", COMPOUNDING)],
    note: FINANCE_NOTE,
    compute(v) {
      const fv = num(v.future, "the future value", { min: 0 });
      const r = num(v.rate, "the rate", { min: 0, max: 1000 }) / 100;
      const n = num(v.freq, "the compounding", { min: 1 });
      const pv = fv / (1 + r / n) ** (n * years(v.years));
      return { results: [{ label: "Present value", value: usd(pv), primary: true }, { label: "Discount", value: usd(fv - pv) }], formula: "PV = FV ÷ (1 + r/n)^(n × t)" };
    },
  },
  "future-value": {
    fields: [field("present", "Starting amount (USD)", "5000"), field("deposit", "Monthly deposit (USD)", "200"), field("rate", "Annual return (%)", "6", { step: "0.01" }), field("years", "Years", "15")],
    note: `${FINANCE_NOTE} Monthly compounding, deposits at the end of each month, constant rate, no taxes or fees.`,
    compute(v) {
      const pv = num(v.present, "the starting amount", { min: 0 });
      const deposit = num(v.deposit || "0", "the monthly deposit", { min: 0 });
      const i = num(v.rate, "the return", { min: 0, max: 1000 }) / 100 / 12;
      const n = Math.round(years(v.years) * 12);
      const growth = (1 + i) ** n;
      const fv = pv * growth + (i === 0 ? deposit * n : deposit * (growth - 1) / i);
      const contributed = pv + deposit * n;
      return {
        results: [{ label: "Future value", value: usd(fv), primary: true }, { label: "Total contributed", value: usd(contributed) }, { label: "Growth", value: usd(fv - contributed) }],
        formula: "FV = PV × (1 + i)^n + PMT × ((1 + i)^n − 1) ÷ i",
      };
    },
  },
  npv: {
    fields: [
      field("rate", "Discount rate (%)", "8", { step: "0.01" }),
      field("initial", "Initial investment (USD)", "50000", { hint: "Paid today (year 0)." }),
      textField("flows", "Cash flows for year 1, 2, 3…", "12000, 15000, 18000, 20000, 22000", "Separate with commas; use a minus sign for outflows."),
    ],
    note: FINANCE_NOTE,
    compute(v) {
      const r = num(v.rate, "the discount rate", { min: -99, max: 1000 }) / 100;
      const initial = num(v.initial, "the initial investment", { min: 0 });
      const flows = numberList(v.flows, "the cash flows");
      const all = [-initial, ...flows];
      const pvFlows = flows.map((flow, t) => flow / (1 + r) ** (t + 1));
      return {
        results: [{ label: "Net present value (NPV)", value: usd(npvAt(r, all)), primary: true }, { label: "Present value of future cash flows", value: usd(pvFlows.reduce((a, b) => a + b, 0)) }],
        formula: "NPV = −initial + Σ CFₜ ÷ (1 + r)^t",
        table: { head: ["Year", "Cash flow", "Present value"], rows: [["0", usd(-initial), usd(-initial)], ...flows.map((flow, t) => [String(t + 1), usd(flow), usd(pvFlows[t])])] },
      };
    },
  },
  irr: {
    fields: [textField("flows", "Cash flows starting with year 0", "-10000, 3000, 4200, 6800", "Year 0 is usually negative (the investment). Separate with commas.")],
    note: `${FINANCE_NOTE} Cash flows that change sign more than once can have more than one IRR; this shows one of them.`,
    compute(v) {
      const flows = numberList(v.flows, "the cash flows", { min: 2 });
      if (!flows.some(flow => flow < 0) || !flows.some(flow => flow > 0)) throw new Error("IRR needs at least one negative and one positive cash flow.");
      const rate = irr(flows);
      if (rate === null) throw new Error("No IRR was found for these cash flows.");
      return {
        results: [{ label: "Internal rate of return (IRR)", value: pct(rate), primary: true }, { label: "Net cash flow (undiscounted)", value: usd(flows.reduce((a, b) => a + b, 0)) }],
        formula: "IRR is the rate r where Σ CFₜ ÷ (1 + r)^t = 0",
      };
    },
  },
  "payback-period": {
    fields: [
      field("initial", "Initial investment (USD)", "40000"),
      textField("flows", "Yearly cash inflows (year 1, 2, 3…)", "9000, 12000, 14000, 15000, 15000", "Separate with commas."),
      field("rate", "Discount rate for discounted payback (%)", "8", { step: "0.01" }),
    ],
    note: `${FINANCE_NOTE} Assumes cash flows arrive evenly within each year.`,
    compute(v) {
      const initial = num(v.initial, "the initial investment", { above: 0 });
      const flows = numberList(v.flows, "the cash inflows");
      const r = num(v.rate || "0", "the discount rate", { min: 0, max: 1000 }) / 100;
      const simple = paybackYears(initial, flows);
      const discounted = paybackYears(initial, flows, r);
      const show = (value: number | null) => value === null ? "Not reached within these cash flows" : `${fmt(value, 2)} years`;
      return { results: [{ label: "Payback period", value: show(simple), primary: true }, { label: "Discounted payback period", value: show(discounted) }], formula: "payback = years before recovery + remaining cost ÷ next year's cash flow" };
    },
  },
  "straight-line-depreciation": {
    fields: [field("cost", "Asset cost (USD)", "12000"), field("salvage", "Salvage value (USD)", "2000"), field("life", "Useful life (years)", "5", { step: "1" })],
    note: FINANCE_NOTE,
    compute(v) {
      const { cost, salvage, life } = assetInputs(v);
      const yearly = (cost - salvage) / life;
      const rows = Array.from({ length: life }, (_, index) => [String(index + 1), usd(yearly), usd(yearly * (index + 1)), usd(cost - yearly * (index + 1))]);
      return {
        results: [{ label: "Depreciation per year", value: usd(yearly), primary: true }, { label: "Depreciation rate", value: pct(yearly / cost) }, { label: "Total depreciation", value: usd(cost - salvage) }],
        formula: "yearly depreciation = (cost − salvage) ÷ useful life",
        table: { head: ["Year", "Depreciation", "Accumulated", "Book value"], rows },
      };
    },
  },
  "declining-balance-depreciation": {
    fields: [
      field("cost", "Asset cost (USD)", "12000"),
      field("salvage", "Salvage value (USD)", "2000"),
      field("life", "Useful life (years)", "5", { step: "1" }),
      select("factor", "Method", "2", [["2", "Double declining balance (200%)"], ["1.5", "150% declining balance"]]),
      select("switch", "Switch to straight-line when it is larger", "yes", [["yes", "Yes"], ["no", "No"]]),
    ],
    note: `${FINANCE_NOTE} Book value never goes below the salvage value. Tax rules (for example MACRS) use their own tables.`,
    compute(v) {
      const { cost, salvage, life } = assetInputs(v);
      const rate = num(v.factor, "the method", { above: 0 }) / life;
      const rows = decliningSchedule(cost, salvage, life, rate, v.switch !== "no");
      return {
        results: [{ label: "First-year depreciation", value: usd(rows[0].dep), primary: true }, { label: "Declining rate", value: pct(rate) }, { label: "Final book value", value: usd(rows[rows.length - 1].book) }],
        formula: "depreciation = book value × (factor ÷ life), stopping at salvage value",
        table: { head: ["Year", "Depreciation", "Book value"], rows: rows.map((row, index) => [String(index + 1), usd(row.dep), usd(row.book)]) },
      };
    },
  },
  "rule-of-72": {
    fields: [select("mode", "Find", "years", [["years", "Years to double from a rate"], ["rate", "Rate needed to double in a number of years"]]), field("value", "Annual rate (%) or years", "8", { step: "0.01" })],
    compute(v) {
      const value = num(v.value, "the value", { above: 0, max: 1000 });
      if (v.mode === "rate") {
        return { results: [{ label: "Rate needed (rule of 72)", value: `${fmt(72 / value, 2)}%`, primary: true }, { label: "Exact rate (yearly compounding)", value: pct(2 ** (1 / value) - 1) }], formula: "rate ≈ 72 ÷ years" };
      }
      return { results: [{ label: "Years to double (rule of 72)", value: fmt(72 / value, 2), primary: true }, { label: "Exact years (yearly compounding)", value: fmt(Math.log(2) / Math.log(1 + value / 100), 2) }], formula: "years ≈ 72 ÷ rate (%)" };
    },
  },
  apy: {
    fields: [field("apr", "Nominal annual rate, APR (%)", "5", { step: "0.01" }), select("freq", "Compounding", "12", [...COMPOUNDING, ["continuous", "Continuous"]])],
    compute(v) {
      const apr = num(v.apr, "the APR", { min: 0, max: 1000 }) / 100;
      const apy = v.freq === "continuous" ? Math.exp(apr) - 1 : (1 + apr / num(v.freq, "the compounding", { min: 1 })) ** num(v.freq, "the compounding", { min: 1 }) - 1;
      return { results: [{ label: "APY (effective annual rate)", value: pct(apy, 3), primary: true }, { label: "APR", value: pct(apr, 3) }], formula: v.freq === "continuous" ? "APY = e^APR − 1" : "APY = (1 + APR/n)^n − 1" };
    },
  },
};

function assetInputs(v: Record<string, string>) {
  const cost = num(v.cost, "the asset cost", { above: 0 });
  const salvage = num(v.salvage, "the salvage value", { min: 0 });
  if (salvage >= cost) throw new Error("The salvage value must be less than the cost.");
  const life = num(v.life, "the useful life", { min: 1, max: 100, integer: true });
  return { cost, salvage, life };
}

function decliningSchedule(cost: number, salvage: number, life: number, rate: number, switchToLine: boolean) {
  const rows: Array<{ dep: number; book: number }> = [];
  let book = cost;
  for (let year = 1; year <= life; year += 1) {
    const declining = book * rate;
    const line = (book - salvage) / (life - year + 1);
    const dep = Math.min(switchToLine ? Math.max(declining, line) : declining, book - salvage);
    book -= dep;
    rows.push({ dep, book });
  }
  return rows;
}
