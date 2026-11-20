import type { CalcOp } from "./types";
import { field, fmt, num, pct, select, usd } from "./calc-finance-core.ts";

const SAAS_NOTE = "Uses the numbers you enter; definitions of SaaS metrics vary between companies, so keep yours consistent.";
const PERIODS: Array<[string, string]> = [["12", "Month"], ["4", "Quarter"], ["1", "Year"]];

export const saasOps: Record<string, CalcOp> = {
  "saas-mrr": {
    fields: [
      field("monthlyCustomers", "Customers on monthly plans", "120", { step: "1" }),
      field("monthlyPrice", "Average monthly plan price (USD)", "49", { step: "0.01" }),
      field("annualCustomers", "Customers on annual plans", "40", { step: "1" }),
      field("annualPrice", "Average annual plan price per year (USD)", "490", { step: "0.01" }),
    ],
    note: SAAS_NOTE,
    compute(v) {
      const mc = num(v.monthlyCustomers, "the monthly customers", { min: 0, integer: true });
      const mp = num(v.monthlyPrice, "the monthly price", { min: 0 });
      const ac = num(v.annualCustomers, "the annual customers", { min: 0, integer: true });
      const ap = num(v.annualPrice, "the annual price", { min: 0 });
      const mrr = mc * mp + ac * ap / 12;
      const customers = mc + ac;
      return {
        results: [
          { label: "MRR", value: usd(mrr), primary: true },
          { label: "ARR (MRR × 12)", value: usd(mrr * 12) },
          { label: "Average revenue per account (monthly)", value: customers > 0 ? usd(mrr / customers) : "No customers" },
        ],
        formula: "MRR = monthly customers × monthly price + annual customers × annual price ÷ 12",
      };
    },
  },
  "saas-arr": {
    fields: [
      field("start", "Starting ARR (USD)", "1200000"),
      field("newArr", "New ARR from new customers (USD)", "300000"),
      field("expansion", "Expansion ARR (upgrades) (USD)", "90000"),
      field("contraction", "Contraction ARR (downgrades) (USD)", "30000"),
      field("churned", "Churned ARR (USD)", "120000"),
    ],
    note: SAAS_NOTE,
    compute(v) {
      const start = num(v.start, "the starting ARR", { min: 0 });
      const parts = ["newArr", "expansion", "contraction", "churned"].map(key => num(v[key], "each ARR movement", { min: 0 }));
      const [added, expansion, contraction, churned] = parts;
      const netNew = added + expansion - contraction - churned;
      const ending = start + netNew;
      return {
        results: [
          { label: "Ending ARR", value: usd(ending), primary: true },
          { label: "Net new ARR", value: usd(netNew) },
          { label: "ARR growth", value: start > 0 ? pct(netNew / start) : "Undefined (no starting ARR)" },
          { label: "Ending MRR (ARR ÷ 12)", value: usd(ending / 12) },
        ],
        formula: "ending ARR = start + new + expansion − contraction − churn",
      };
    },
  },
  "churn-rate": {
    fields: [
      field("start", "Customers at the start of the period", "800", { step: "1" }),
      field("lost", "Customers lost during the period", "24", { step: "1" }),
      select("period", "Period length", "12", PERIODS),
    ],
    note: SAAS_NOTE,
    compute(v) {
      const start = num(v.start, "the starting customers", { above: 0, integer: true });
      const lost = num(v.lost, "the lost customers", { min: 0, integer: true });
      if (lost > start) throw new Error("Lost customers cannot exceed the customers you started with.");
      const perYear = num(v.period, "the period", { min: 1 });
      const churn = lost / start;
      return {
        results: [
          { label: "Churn rate (per period)", value: pct(churn), primary: true },
          { label: "Retention rate (per period)", value: pct(1 - churn) },
          { label: "Annualized churn (compounded)", value: pct(1 - (1 - churn) ** perYear) },
        ],
        formula: "churn = customers lost ÷ customers at start; annual = 1 − (1 − churn)^periods per year",
      };
    },
  },
  "net-revenue-retention": {
    fields: [
      field("start", "Starting MRR from existing customers (USD)", "50000"),
      field("expansion", "Expansion MRR (USD)", "6000"),
      field("contraction", "Contraction MRR (USD)", "1500"),
      field("churned", "Churned MRR (USD)", "2500"),
    ],
    note: SAAS_NOTE + " Revenue from new customers is excluded.",
    compute(v) {
      const start = num(v.start, "the starting MRR", { above: 0 });
      const expansion = num(v.expansion, "the expansion MRR", { min: 0 });
      const contraction = num(v.contraction, "the contraction MRR", { min: 0 });
      const churned = num(v.churned, "the churned MRR", { min: 0 });
      if (contraction + churned > start) throw new Error("Contraction plus churn cannot exceed the starting MRR.");
      return {
        results: [
          { label: "Net revenue retention (NRR)", value: pct((start + expansion - contraction - churned) / start), primary: true },
          { label: "Gross revenue retention (GRR)", value: pct((start - contraction - churned) / start) },
          { label: "Ending MRR from these customers", value: usd(start + expansion - contraction - churned) },
        ],
        formula: "NRR = (start + expansion − contraction − churn) ÷ start; GRR excludes expansion",
      };
    },
  },
  "customer-ltv": {
    fields: [
      field("arpa", "Average revenue per account per month (USD)", "60", { step: "0.01" }),
      field("margin", "Gross margin (%)", "80", { step: "0.1" }),
      field("churn", "Monthly churn rate (%)", "3", { step: "0.01" }),
      field("cac", "Customer acquisition cost (USD, optional)", "400"),
    ],
    note: SAAS_NOTE + " The simple LTV formula assumes constant revenue and churn.",
    compute(v) {
      const arpa = num(v.arpa, "the revenue per account", { min: 0 });
      const margin = num(v.margin, "the gross margin", { min: 0, max: 100 }) / 100;
      const churn = num(v.churn, "the monthly churn", { above: 0, max: 100 }) / 100;
      const cac = num(v.cac || "0", "the acquisition cost", { min: 0 });
      const ltv = arpa * margin / churn;
      return {
        results: [
          { label: "Customer lifetime value (LTV)", value: usd(ltv), primary: true },
          { label: "Average customer lifetime", value: `${fmt(1 / churn, 1)} months` },
          { label: "LTV : CAC", value: cac > 0 ? `${fmt(ltv / cac, 2)} : 1` : "Enter a CAC to compare" },
        ],
        formula: "LTV = ARPA × gross margin ÷ monthly churn",
      };
    },
  },
  "cac-payback": {
    fields: [
      field("spend", "Sales and marketing spend (USD)", "60000"),
      field("customers", "New customers acquired", "150", { step: "1" }),
      field("arpa", "Average revenue per new account per month (USD)", "80", { step: "0.01" }),
      field("margin", "Gross margin (%)", "75", { step: "0.1" }),
    ],
    note: SAAS_NOTE,
    compute(v) {
      const spend = num(v.spend, "the spend", { min: 0 });
      const customers = num(v.customers, "the new customers", { above: 0, integer: true });
      const arpa = num(v.arpa, "the revenue per account", { above: 0 });
      const margin = num(v.margin, "the gross margin", { above: 0, max: 100 }) / 100;
      const cac = spend / customers;
      return {
        results: [
          { label: "CAC payback period", value: `${fmt(cac / (arpa * margin), 1)} months`, primary: true },
          { label: "Customer acquisition cost (CAC)", value: usd(cac) },
          { label: "Monthly gross profit per account", value: usd(arpa * margin) },
        ],
        formula: "CAC = spend ÷ new customers; payback = CAC ÷ (ARPA × gross margin)",
      };
    },
  },
};
